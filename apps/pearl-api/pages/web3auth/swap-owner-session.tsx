import { createGlobalStyle } from 'styled-components';
import { useWeb3Auth } from '@web3auth/modal/react';
import { Web3AuthProvider } from 'context/Web3AuthProvider';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { Address } from 'viem';
import Safe from '@safe-global/protocol-kit';

export const Styles = createGlobalStyle`
  .w3a-parent-container > div {
    background-color: rgba(0, 0, 0, 0.45) !important;
  }
`;

type TransactionResult = {
  success: boolean;
  txHash?: string;
  error?: string;
  chainId?: number;
  safeAddress?: string;
};

const SwapOwnerSession = () => {
  const { provider, isInitialized } = useWeb3Auth();
  const router = useRouter();
  const [status, setStatus] = useState<string>('Initializing...');
  const [result, setResult] = useState<TransactionResult | null>(null);
  const hasExecuted = useRef(false);

  const { safeAddress, oldOwnerAddress, newOwnerAddress, backupOwnerAddress, chainId } =
    router.query;

  useEffect(() => {
    const executeSwapOwner = async () => {
      if (
        !provider ||
        !isInitialized ||
        hasExecuted.current ||
        !safeAddress ||
        !oldOwnerAddress ||
        !newOwnerAddress ||
        !backupOwnerAddress
      ) {
        return;
      }

      hasExecuted.current = true;

      try {
        setStatus('Initializing Safe Protocol Kit...');

        // Initialize Safe Protocol Kit with backup owner as signer
        const protocolKit = await Safe.init({
          signer: backupOwnerAddress as Address,
          provider: provider,
          safeAddress: safeAddress as Address,
        });

        setStatus('Creating swap owner transaction...');

        // Create swap owner transaction
        const swapOwnerTx = await protocolKit.createSwapOwnerTx({
          oldOwnerAddress: oldOwnerAddress as Address,
          newOwnerAddress: newOwnerAddress as Address,
        });

        // Create Safe transaction
        const safeTx = await protocolKit.createTransaction({
          transactions: [swapOwnerTx.data],
        });

        setStatus('Executing transaction (please sign in wallet)...');

        const executeTxResponse = await protocolKit.executeTransaction(safeTx);

        setStatus('Transaction successful! You can close this window.');

        const successResult: TransactionResult = {
          success: true,
          txHash: executeTxResponse.hash,
          chainId: chainId ? Number(chainId) : undefined,
          safeAddress: safeAddress as string,
        };

        setResult(successResult);

        // Try to send result back to Pearl if it's listening
        if (window.opener) {
          window.opener.postMessage({ type: 'SWAP_OWNER_RESULT', ...successResult }, '*');
        }
      } catch (error) {
        console.error('Error swapping owner:', error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';

        setStatus(`Transaction failed: ${errorMsg}`);

        const errorResult: TransactionResult = {
          success: false,
          error: errorMsg,
          chainId: chainId ? Number(chainId) : undefined,
          safeAddress: safeAddress as string,
        };

        setResult(errorResult);

        // Try to send error back to Pearl if it's listening
        if (window.opener) {
          window.opener.postMessage({ type: 'SWAP_OWNER_RESULT', ...errorResult }, '*');
        }
      }
    };

    if (isInitialized && provider) {
      executeSwapOwner();
    }
  }, [
    provider,
    isInitialized,
    safeAddress,
    oldOwnerAddress,
    newOwnerAddress,
    backupOwnerAddress,
    chainId,
  ]);

  return (
    <div
      style={{
        padding: '40px',
        fontFamily: 'sans-serif',
        maxWidth: '600px',
        margin: '0 auto',
      }}
    >
      <h2>Safe Owner Swap Transaction</h2>

      <div
        style={{
          marginTop: '20px',
          padding: '16px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
        }}
      >
        <p>
          <strong>Status:</strong> {status}
        </p>

        {safeAddress && (
          <div style={{ marginTop: '12px', fontSize: '14px' }}>
            <p>
              <strong>Safe Address:</strong> {safeAddress}
            </p>
            <p>
              <strong>Chain ID:</strong> {chainId || 'Unknown'}
            </p>
          </div>
        )}
      </div>

      {result && (
        <div
          style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: result.success ? '#d4edda' : '#f8d7da',
            color: result.success ? '#155724' : '#721c24',
            borderRadius: '8px',
          }}
        >
          {result.success ? (
            <>
              <h3>✓ Transaction Successful!</h3>
              <p>
                <strong>Transaction Hash:</strong>
              </p>
              <p style={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '12px' }}>
                {result.txHash}
              </p>
              <p style={{ marginTop: '12px' }}>You can safely close this window.</p>
            </>
          ) : (
            <>
              <h3>✗ Transaction Failed</h3>
              <p>
                <strong>Error:</strong> {result.error}
              </p>
              <p style={{ marginTop: '12px' }}>You can close this window and try again.</p>
            </>
          )}
        </div>
      )}

      {!isInitialized && (
        <div style={{ marginTop: '20px' }}>
          <p>Loading Web3Auth...</p>
        </div>
      )}

      {result && (
        <div
          style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: '#fff3cd',
            borderRadius: '8px',
          }}
        >
          <p>
            <strong>Result Data (for Pearl):</strong>
          </p>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default function Page() {
  return (
    <>
      <Styles />
      <Web3AuthProvider>
        <SwapOwnerSession />
      </Web3AuthProvider>
    </>
  );
}
