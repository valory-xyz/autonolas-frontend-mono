import { createGlobalStyle } from 'styled-components';
import { useWeb3Auth, useWeb3AuthConnect } from '@web3auth/modal/react';
import { Web3AuthProvider } from 'context/Web3AuthProvider';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { Address } from 'viem';
import Safe from '@safe-global/protocol-kit';
import { Card, Typography, Alert, Spin, Descriptions, Space } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';

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

const SwapOwnerSession = () => {
  const { provider, isInitialized, web3Auth } = useWeb3Auth();
  const { connect, isConnected } = useWeb3AuthConnect();
  const router = useRouter();
  const [status, setStatus] = useState<string>('Initializing...');
  const [result, setResult] = useState<TransactionResult | null>(null);
  const [targetWindow, setTargetWindow] = useState<Window | null>(null);
  const hasExecuted = useRef(false);

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
      // Send result back to Pearl (supports both iframe and popup)
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
        setStatus('Initializing Safe Protocol Kit...');

        // Get the connected wallet address from Web3Auth
        const accounts = (await provider.request({ method: 'eth_accounts' })) as string[];
        const connectedAddress = accounts?.[0];

        if (!connectedAddress) {
          throw new Error('No connected wallet address found');
        }

        // Verify the connected address matches the backup owner
        if (connectedAddress.toLowerCase() !== (backupOwnerAddress as string).toLowerCase()) {
          throw new Error(
            `Connected address (${connectedAddress}) does not match backup owner address (${backupOwnerAddress}). Please login with the correct account.`,
          );
        }

        // Initialize Safe Protocol Kit with the Web3Auth provider
        // The provider will automatically use the connected address as signer
        const protocolKit = await Safe.init({ provider, safeAddress: safeAddress as Address });

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

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={2}>Safe Owner Swap Transaction</Title>

        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text strong>Status: </Text>
              {!result && <LoadingOutlined style={{ marginLeft: 8 }} />}
              <Text>{status}</Text>
            </div>

            {safeAddress && (
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Safe Address">
                  <Text code copyable>
                    {safeAddress}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Chain ID">{chainId || 'Unknown'}</Descriptions.Item>
              </Descriptions>
            )}
          </Space>
        </Card>

        {result && result.success && (
          <Alert
            message="Transaction Successful!"
            description={
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div>
                  <Text strong>Transaction Hash:</Text>
                  <br />
                  <Text code copyable style={{ wordBreak: 'break-all', fontSize: '12px' }}>
                    {result.txHash}
                  </Text>
                </div>
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
                <div>
                  <Text strong>Error: </Text>
                  <Text>{result.error}</Text>
                </div>
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

        {!isInitialized && (
          <Card>
            <Space>
              <Spin />
              <Text>Loading Web3Auth...</Text>
            </Space>
          </Card>
        )}

        {result && (
          <Card title="Result Data (for Pearl)" size="small">
            <pre style={{ fontSize: '12px', overflow: 'auto', margin: 0 }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </Card>
        )}
      </Space>
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
