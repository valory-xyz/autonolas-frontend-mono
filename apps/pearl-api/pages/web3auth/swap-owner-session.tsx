import { createGlobalStyle } from 'styled-components';
import { useWeb3Auth } from '@web3auth/modal/react';
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
