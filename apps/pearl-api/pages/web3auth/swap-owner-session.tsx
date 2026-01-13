import { LoadingOutlined } from '@ant-design/icons';
import Safe from '@safe-global/protocol-kit';
import { useWeb3Auth, useWeb3AuthConnect } from '@web3auth/modal/react';
import { Card, Flex, Space, Typography } from 'antd';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createGlobalStyle } from 'styled-components';
import { Address } from 'viem';

import { Web3AuthProvider } from 'context/Web3AuthProvider';
import { useReconnectWeb3Auth } from 'hooks/useReconnectWeb3Auth';
import {
  ChainIdMissingAlert,
  InitErrorAlert,
  Loading,
  SwapOwnerFailed,
  SwapOwnerSuccess,
} from '../../components/web3auth';
import {
  EvmChainDetails,
  EvmChainId,
  EvmChainName,
  toHexChainId,
  waitForTransactionReceipt,
} from '../../utils';

const { Title, Text } = Typography;

const CHAIN_NOT_ADDED_ERROR_CODE = 4902;

const Styles = createGlobalStyle`
  .w3a-parent-container > div {
    background-color: rgba(0, 0, 0, 0.45) !important;
  }
`;

enum Events {
  WEB3AUTH_SWAP_OWNER_MODAL_INITIALIZED = 'WEB3AUTH_SWAP_OWNER_MODAL_INITIALIZED',
  WEB3AUTH_SWAP_OWNER_SUCCESS = 'WEB3AUTH_SWAP_OWNER_SUCCESS',
  WEB3AUTH_SWAP_OWNER_FAILURE = 'WEB3AUTH_SWAP_OWNER_FAILURE',
  WEB3AUTH_SWAP_OWNER_MODAL_CLOSED = 'WEB3AUTH_SWAP_OWNER_MODAL_CLOSED',
}

type TransactionSuccess = {
  success: true;
  txHash: string;
  chainId: EvmChainId;
  safeAddress: string;
};

type TransactionFailure = {
  success: false;
  error: string;
  chainId?: EvmChainId;
  safeAddress?: string;
  txHash?: string;
};

const SwapOwnerSession = () => {
  const { provider, isInitialized, web3Auth, initError } = useWeb3Auth();
  const { connect, isConnected } = useWeb3AuthConnect();
  const reconnect = useReconnectWeb3Auth(web3Auth);
  const router = useRouter();
  const hasExecuted = useRef(false);
  const [status, setStatus] = useState<string>('Initializing...');
  const [result, setResult] = useState<TransactionSuccess | TransactionFailure | null>(null);
  const [targetWindow, setTargetWindow] = useState<Window | null>(null);

  const {
    safeAddress,
    oldOwnerAddress,
    newOwnerAddress,
    backupOwnerAddress,
    chainId: untypedChainId,
  } = router.query;
  const chainId = untypedChainId as unknown as EvmChainId | undefined;

  // Initialize targetWindow only on client side
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.parent) return;
    setTargetWindow(window.parent);
  }, []);

  // Notify when Web3Auth is initialized
  useEffect(() => {
    if (isInitialized && targetWindow) {
      targetWindow.postMessage({ event_id: Events.WEB3AUTH_SWAP_OWNER_MODAL_INITIALIZED }, '*');
    }
  }, [isInitialized, targetWindow]);

  // Auto-connect Web3Auth modal when initialized and not already connected
  useEffect(() => {
    if (isInitialized && !isConnected && !provider) {
      setStatus('Opening Web3Auth modal...');
      const attemptConnect = async () => {
        try {
          await connect();
        } catch (e) {
          const message = (e as Error)?.message ?? '';
          if (message.includes('Session Expired')) {
            try {
              await reconnect();
            } catch (reconnectError) {
              console.error('Error during Web3Auth reconnection:', reconnectError);
            }
          }
        }
      };

      attemptConnect();
    }
  }, [isInitialized, isConnected, provider, connect, web3Auth, reconnect]);

  useEffect(() => {
    const executeSwapOwner = async () => {
      if (
        hasExecuted.current ||
        !provider ||
        !isInitialized ||
        !safeAddress ||
        !oldOwnerAddress ||
        !newOwnerAddress ||
        !backupOwnerAddress ||
        !chainId
      ) {
        return;
      }

      hasExecuted.current = true;
      let submittedTxHash: string | undefined;

      try {
        setStatus('Switching to correct chain...');

        // Switch to the correct chain if chainId is provided
        const chainHex = toHexChainId(Number(chainId));

        try {
          // Try switching to the provided chain
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: chainHex }],
          });
        } catch (e: unknown) {
          const error = e as { code?: number; message?: string };
          if (error.code === CHAIN_NOT_ADDED_ERROR_CODE) {
            console.warn(`Chain ${chainHex} not found in wallet.`);
          }
          throw error;
        }

        setStatus('Getting connected wallet address...');

        // Get the connected wallet address from Web3Auth
        const accounts = (await provider.request({
          method: 'eth_accounts',
        })) as string[];
        const connectedAddress = accounts?.[0];

        if (!connectedAddress) {
          throw new Error('No connected wallet address found.');
        }

        setStatus('Initializing Safe Protocol Kit...');

        // Verify the connected address matches the backup owner
        if (connectedAddress.toLowerCase() !== (backupOwnerAddress as string).toLowerCase()) {
          throw new Error(
            `Connected address (${connectedAddress}) does not match backup owner address (${backupOwnerAddress}). Please login with the correct account.`,
          );
        }

        // Initialize Safe Protocol Kit with the Web3Auth provider
        // The provider will automatically use the connected address as signer
        const protocolKit = await Safe.init({
          provider,
          signer: connectedAddress,
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
        const txHash = executeTxResponse.hash;
        submittedTxHash = txHash;

        setStatus('Transaction submitted. Waiting for confirmation...');

        // Wait for transaction to be mined and confirmed
        await waitForTransactionReceipt(provider, txHash, (attempt, maxAttempts) => {
          setStatus(`Waiting for transaction confirmation... (${attempt}/${maxAttempts} attempts)`);
        });

        setStatus('Transaction confirmed successfully! You can close this window.');

        const successResult: TransactionSuccess = {
          success: true,
          txHash,
          chainId,
          safeAddress: safeAddress as string,
        };

        setResult(successResult);

        if (targetWindow) {
          targetWindow.postMessage(
            { event_id: Events.WEB3AUTH_SWAP_OWNER_SUCCESS, ...successResult },
            '*',
          );
        }
      } catch (error) {
        console.error('Error swapping owner:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        setStatus(`Transaction failed: ${errorMessage}`);

        const errorResult: TransactionFailure = {
          success: false,
          error: errorMessage,
          chainId: chainId || undefined,
          safeAddress: (safeAddress as string) || undefined,
          txHash: submittedTxHash,
        };

        setResult(errorResult);

        if (targetWindow) {
          targetWindow.postMessage(
            { event_id: Events.WEB3AUTH_SWAP_OWNER_FAILURE, ...errorResult },
            '*',
          );
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
    targetWindow,
    web3Auth,
  ]);

  // Notify if Web3Auth modal is closed without connecting
  useEffect(() => {
    if (!web3Auth) return;

    const handleModalClose = (isVisible: boolean) => {
      if (!isVisible && targetWindow) {
        targetWindow.postMessage(
          {
            event_id: Events.WEB3AUTH_SWAP_OWNER_MODAL_CLOSED,
            error: 'User closed Web3Auth modal without connecting',
          },
          '*',
        );
      }
    };

    web3Auth.on('MODAL_VISIBILITY', handleModalClose);
    return () => {
      web3Auth.off('MODAL_VISIBILITY', handleModalClose);
    };
  }, [web3Auth, isConnected, result, targetWindow]);

  // Notify if user closes the entire window/iframe before transaction completes
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Only send message if transaction hasn't completed yet
      if (result) return;
      if (!targetWindow) return;

      targetWindow.postMessage(
        {
          event_id: Events.WEB3AUTH_SWAP_OWNER_MODAL_CLOSED,
          success: false,
          error: 'User closed window before transaction completed',
        },
        '*',
      );
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [result, targetWindow]);

  const chainName = useMemo(() => {
    if (!chainId) return 'Unknown Chain';
    return `${EvmChainName[chainId] || chainId}`;
  }, [chainId]);

  if (!isInitialized && !initError) return <Loading />;

  if (!chainId) return <ChainIdMissingAlert />;

  if (initError) return <InitErrorAlert error={initError as Error} />;

  return (
    <Flex vertical gap={16} style={{ padding: 16 }}>
      <Title level={3} style={{ margin: 0 }}>
        {`Approve Transaction - ${chainName} `}
      </Title>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>Status: </Text>
            {!result && <LoadingOutlined style={{ margin: '0 8px' }} />}
            <Text>{status}</Text>
          </div>

          {safeAddress && (
            <Flex vertical gap={2}>
              <Text type="secondary">Pearl wallet:</Text>
              <Text code copyable>
                {safeAddress}
              </Text>
            </Flex>
          )}
        </Space>
      </Card>

      {result && result.success && 'txHash' in result && (
        <SwapOwnerSuccess
          txHash={result.txHash}
          txnLink={`${EvmChainDetails[chainId].explorer}/${result.txHash}`}
        />
      )}

      {result && !result.success && 'error' in result && (
        <SwapOwnerFailed error={result.error} txHash={result.txHash} chainId={result.chainId} />
      )}
    </Flex>
  );
};

export default function Page() {
  const router = useRouter();
  const { chainId } = router.query;

  return (
    <>
      <Styles />
      <Web3AuthProvider defaultChainId={chainId ? Number(chainId) : undefined}>
        <SwapOwnerSession />
      </Web3AuthProvider>
    </>
  );
}
