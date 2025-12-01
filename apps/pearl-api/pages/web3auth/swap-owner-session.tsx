import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import Safe from '@safe-global/protocol-kit';
import { useWeb3Auth, useWeb3AuthConnect } from '@web3auth/modal/react';
import { Alert, Card, Flex, Space, Spin, Typography } from 'antd';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createGlobalStyle } from 'styled-components';
import { Address } from 'viem';

import { Web3AuthProvider } from 'context/Web3AuthProvider';

import {
  EvmChainDetails,
  EvmChainId,
  EvmChainName,
  toHexChainId,
  waitForTransactionReceipt,
} from '../../utils';

const { Title, Paragraph, Link, Text } = Typography;

const CHAIN_NOT_ADDED_ERROR_CODE = 4902;

export const Styles = createGlobalStyle`
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

const Loading = () => (
  <Card style={{ margin: 24 }}>
    <Space>
      <Spin />
      <Text>Loading Web3Auth...</Text>
    </Space>
  </Card>
);

const ChainIdMissingAlert = () => (
  <Alert
    message="Error"
    description={<Text>Chain ID is missing.</Text>}
    type="error"
    icon={<CloseCircleOutlined />}
    showIcon
    style={{ margin: 16 }}
  />
);

const InitErrorAlert = ({ error }: { error: Error }) => (
  <Alert
    message="Error Initializing Web3Auth"
    description={
      <Text>{(error instanceof Error ? error : new Error('Unknown error')).message}</Text>
    }
    type="error"
    icon={<CloseCircleOutlined />}
    showIcon
    style={{ margin: 16 }}
  />
);

const SwapOwnerSuccess = ({ txHash, txnLink }: { txHash: string; txnLink: string }) => (
  <Alert
    message="Swap Owner Successful!"
    description={
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Flex vertical gap={2}>
          <Text type="secondary">Transaction Hash:</Text>
          <Link href={txnLink} target="_blank" rel="noopener noreferrer">
            {txHash}
          </Link>
        </Flex>
        <Paragraph style={{ marginBottom: 0, marginTop: 8 }}>
          You can safely close this window.
        </Paragraph>
      </Space>
    }
    type="success"
    icon={<CheckCircleOutlined />}
    showIcon
  />
);

type SwapOwnerFailedProps = { error: string; txHash?: string; chainId?: EvmChainId };
const SwapOwnerFailed = ({ error, txHash, chainId }: SwapOwnerFailedProps) => {
  const explorer = chainId && EvmChainDetails[chainId] ? EvmChainDetails[chainId].explorer : null;
  return (
    <Alert
      message="Swap Owner Failed!"
      description={
        <Space direction="vertical" size="small">
          <Paragraph style={{ marginBottom: 0 }}>{error}</Paragraph>
          {txHash && chainId && EvmChainDetails[chainId] && (
            <Flex vertical gap={2} style={{ marginTop: 8 }}>
              <Text type="secondary">Transaction Hash:</Text>
              <Link href={`${explorer}/tx/${txHash}`} target="_blank" rel="noopener noreferrer">
                {txHash}
              </Link>
            </Flex>
          )}
          <Paragraph style={{ marginBottom: 0, marginTop: 8 }}>
            You can close this window and try again.
          </Paragraph>
        </Space>
      }
      type="error"
      icon={<CloseCircleOutlined />}
      showIcon
    />
  );
};

const SwapOwnerSession = () => {
  const { provider, isInitialized, web3Auth, initError } = useWeb3Auth();
  const { connect, isConnected } = useWeb3AuthConnect();
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
      connect();
    }
  }, [isInitialized, isConnected, provider, connect]);

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
        const accounts = (await provider.request({ method: 'eth_accounts' })) as string[];
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
        const safeTx = await protocolKit.createTransaction({ transactions: [swapOwnerTx.data] });
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
          safeAddress: safeAddress || undefined,
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

  if (!isInitialized) return <Loading />;

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
