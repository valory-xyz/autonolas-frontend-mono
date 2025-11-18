import { createGlobalStyle } from 'styled-components';
import { useWeb3Auth } from '@web3auth/modal/react';
import { Web3AuthProvider } from 'context/Web3AuthProvider';
import { useEffect, useRef, useState } from 'react';
import { Address } from 'viem';
import Safe from '@safe-global/protocol-kit';

export const Styles = createGlobalStyle`
  .w3a-parent-container > div {
    background-color: rgba(0, 0, 0, 0.45) !important;
  }
`;

enum Events {
  SWAP_OWNER_SUCCESS = 'SWAP_OWNER_SUCCESS',
  SWAP_OWNER_ERROR = 'SWAP_OWNER_ERROR',
  SWAP_OWNER_INITIALIZED = 'SWAP_OWNER_INITIALIZED',
  SWAP_OWNER_PROGRESS = 'SWAP_OWNER_PROGRESS',
}

type SwapOwnerParams = {
  safeAddress: Address;
  oldOwnerAddress: Address;
  newOwnerAddress: Address;
  backupOwnerAddress: Address;
};

const SwapOwnerModal = () => {
  const { provider, isInitialized } = useWeb3Auth();
  const [params, setParams] = useState<SwapOwnerParams | null>(null);
  const hasExecuted = useRef(false);

  // Notify parent when initialized
  useEffect(() => {
    if (isInitialized) {
      window.parent.postMessage({ event_id: Events.SWAP_OWNER_INITIALIZED }, '*');
    }
  }, [isInitialized]);

  // Listen for transaction parameters from parent window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.action === 'EXECUTE_SWAP_OWNER' && event.data.params) {
        setParams(event.data.params);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    const executeSwapOwner = async () => {
      if (!provider || !params || !isInitialized || hasExecuted.current) return;

      hasExecuted.current = true;

      try {
        // Notify parent of progress
        window.parent.postMessage(
          { event_id: Events.SWAP_OWNER_PROGRESS, message: 'Initializing Safe Protocol Kit...' },
          '*',
        );

        // Initialize Safe Protocol Kit with backup owner as signer
        const protocolKit = await Safe.init({
          signer: params.backupOwnerAddress,
          provider: provider,
          safeAddress: params.safeAddress,
        });

        window.parent.postMessage(
          { event_id: Events.SWAP_OWNER_PROGRESS, message: 'Creating swap owner transaction...' },
          '*',
        );

        // Create swap owner transaction
        const swapOwnerTx = await protocolKit.createSwapOwnerTx({
          oldOwnerAddress: params.oldOwnerAddress,
          newOwnerAddress: params.newOwnerAddress,
        });

        // Create Safe transaction
        const safeTx = await protocolKit.createTransaction({
          transactions: [swapOwnerTx.data],
        });

        window.parent.postMessage(
          { event_id: Events.SWAP_OWNER_PROGRESS, message: 'Executing transaction...' },
          '*',
        );

        const executeTxResponse = await protocolKit.executeTransaction(safeTx);

        // Notify parent of success
        window.parent.postMessage(
          {
            event_id: Events.SWAP_OWNER_SUCCESS,
            txHash: executeTxResponse.hash,
            message: 'Owner swap transaction executed successfully',
          },
          '*',
        );
      } catch (error) {
        console.error('Error swapping owner:', error);

        // Notify parent of error
        window.parent.postMessage(
          {
            event_id: Events.SWAP_OWNER_ERROR,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
          },
          '*',
        );
      }
    };

    if (isInitialized && provider && params) {
      executeSwapOwner();
    }
  }, [provider, params, isInitialized]);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h3>Swap Safe Owner</h3>
      {!isInitialized && <p>Initializing Web3Auth...</p>}
      {isInitialized && !params && <p>Waiting for transaction parameters...</p>}
      {params && <p>Processing owner swap transaction...</p>}
    </div>
  );
};

export default function Page() {
  return (
    <>
      <Styles />
      <Web3AuthProvider>
        <SwapOwnerModal />
      </Web3AuthProvider>
    </>
  );
}
