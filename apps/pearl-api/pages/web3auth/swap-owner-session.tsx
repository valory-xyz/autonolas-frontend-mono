import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import Safe from '@safe-global/protocol-kit';
import { useWeb3Auth, useWeb3AuthConnect } from '@web3auth/modal/react';
import { Alert, Card, Flex, Space, Spin, Typography } from 'antd';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { createGlobalStyle } from 'styled-components';
import { Address } from 'viem';

import { Web3AuthProvider } from 'context/Web3AuthProvider';

import { EvmChainId, EvmChainName } from '../../utils/index';

const { Title, Paragraph, Text } = Typography;

export const Styles = createGlobalStyle`
  .w3a-parent-container > div {
    background-color: rgba(0, 0, 0, 0.45) !important;
  }
`;

enum Events {
  WEB3AUTH_SWAP_OWNER_MODAL_INITIALIZED = 'WEB3AUTH_SWAP_OWNER_MODAL_INITIALIZED',
  WEB3AUTH_SWAP_OWNER_RESULT = 'WEB3AUTH_SWAP_OWNER_RESULT',
  WEB3AUTH_SWAP_OWNER_MODAL_CLOSED = 'WEB3AUTH_SWAP_OWNER_MODAL_CLOSED',
}

type TransactionResult = {
  success: boolean;
  txHash?: string;
  error?: string;
  chainId?: number;
  safeAddress?: string;
};

const Loading = () => (
  <Card style={{ margin: 24 }}>
    <Space>
      <Spin />
      <Text>Loading Web3Auth...</Text>
    </Space>
  </Card>
);

const SwapOwnerSession = () => {
  const { provider, isInitialized, web3Auth, initError } = useWeb3Auth();
  const { connect, isConnected } = useWeb3AuthConnect();
  const router = useRouter();
  const hasExecuted = useRef(false);
  const [status, setStatus] = useState<string>('Initializing...');
  const [result, setResult] = useState<TransactionResult | null>(null);
  const [targetWindow, setTargetWindow] = useState<Window | null>(null);

  const { safeAddress, oldOwnerAddress, newOwnerAddress, backupOwnerAddress, chainId } =
    router.query;

  // Initialize targetWindow only on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTargetWindow(window.parent !== window ? window.parent : window.opener);
    }
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
        !backupOwnerAddress
      ) {
        return;
      }

      hasExecuted.current = true;

      try {
        setStatus('Switching to correct chain...');

        console.log('Web3Auth user info', await web3Auth?.getUserInfo?.());
        console.log('Connected wallets', await provider.request({ method: 'eth_accounts' }));

        // Switch to the correct chain if chainId is provided
        const chainHex = `0x${Number(chainId).toString(16)}`;

        try {
          // Try switching to the provided chain
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: chainHex }],
          });
        } catch (e: unknown) {
          const error = e as { code?: number; message?: string };
          // 4902 = chain not added (user wallet doesn’t know the chain)
          if (error.code === 4902) {
            console.warn(`Chain ${chainHex} not found in wallet.`);
          }
          throw error;
        }

        setStatus('Getting connected wallet address...');

        // Get the connected wallet address from Web3Auth
        const accounts = (await provider.request({ method: 'eth_accounts' })) as string[];
        console.log('Connected accounts:', accounts);

        const connectedAddress = accounts?.[0];

        if (!connectedAddress) {
          throw new Error('No connected wallet address found');
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
        setStatus('Transaction successful! You can close this window.');

        const successResult: TransactionResult = {
          success: true,
          txHash: executeTxResponse.hash,
          chainId: chainId ? Number(chainId) : undefined,
          safeAddress: safeAddress as string,
        };

        setResult(successResult);

        if (targetWindow) {
          targetWindow.postMessage(
            { event_id: Events.WEB3AUTH_SWAP_OWNER_RESULT, ...successResult },
            '*',
          );
        }
      } catch (error) {
        console.error('Error swapping owner:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        setStatus(`Transaction failed: ${errorMessage}`);

        const errorResult: TransactionResult = {
          success: false,
          error: errorMessage,
          chainId: chainId ? Number(chainId) : undefined,
          safeAddress: safeAddress as string,
        };

        setResult(errorResult);

        // Send error back to Pearl (supports both iframe and popup)
        if (targetWindow) {
          targetWindow.postMessage(
            { event_id: Events.WEB3AUTH_SWAP_OWNER_RESULT, ...errorResult },
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
      if (!isVisible && !isConnected && !result) {
        if (!targetWindow) return;
        targetWindow.postMessage(
          {
            event_id: Events.WEB3AUTH_SWAP_OWNER_MODAL_CLOSED,
            success: false,
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
    if (typeof window === 'undefined') return;

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

  console.log('SwapOwnerSession render', { isInitialized, initError, status, result });

  if (!isInitialized) return <Loading />;

  if (initError) {
    return (
      <Alert
        message="Error Initializing Web3Auth"
        description={
          <Text>
            {(initError instanceof Error ? initError : new Error('Unknown error')).message}
          </Text>
        }
        type="error"
        icon={<CloseCircleOutlined />}
        showIcon
        style={{ margin: 16 }}
      />
    );
  }

  return (
    <Flex vertical gap={16} style={{ padding: 16 }}>
      <Title level={2} style={{ margin: 0 }}>
        {`Approve Transaction - ${EvmChainName[chainId as unknown as EvmChainId] || chainId} `}
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
              <Text type="secondary">Safe Address:</Text>
              <Text code copyable>
                {safeAddress}
              </Text>
            </Flex>
          )}
        </Space>
      </Card>

      {result && result.success && (
        <Alert
          message="Transaction Successful!"
          description={
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Flex vertical gap={2}>
                <Text type="secondary">Transaction Hash:</Text>
                <Text code copyable>
                  {result.txHash}
                </Text>
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
      )}

      {result && !result.success && (
        <Alert
          message="Transaction Failed"
          description={
            <Space direction="vertical" size="small">
              <Paragraph style={{ marginBottom: 0 }}>{result.error}</Paragraph>
              <Paragraph style={{ marginBottom: 0 }}>
                You can close this window and try again.
              </Paragraph>
            </Space>
          }
          type="error"
          icon={<CloseCircleOutlined />}
          showIcon
        />
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
