import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Alert, Card, Flex, Space, Spin, Typography } from 'antd';
import { useEffect } from 'react';

import { EvmChainDetails, EvmChainId } from '../utils';

const { Paragraph, Link, Text } = Typography;

export const Loading = () => (
  <Card style={{ margin: 24 }}>
    <Space>
      <Spin />
      <Text>Loading Web3Auth...</Text>
    </Space>
  </Card>
);

export const ChainIdMissingAlert = () => (
  <Alert
    message="Error"
    description={<Text>Chain ID is missing.</Text>}
    type="error"
    icon={<CloseCircleOutlined />}
    showIcon
    style={{ margin: 16 }}
  />
);

export const InitErrorAlert = ({ error }: { error: Error }) => (
  <Alert
    message="Error Initializing Web3Auth"
    description={<Text>{error instanceof Error ? error.message : 'Unknown error'}</Text>}
    type="error"
    icon={<CloseCircleOutlined />}
    showIcon
    style={{ margin: 16 }}
  />
);

export const SwapOwnerSuccess = ({ txHash, txnLink }: { txHash: string; txnLink: string }) => (
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
export const SwapOwnerFailed = ({ error, txHash, chainId }: SwapOwnerFailedProps) => {
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

type Web3AuthDisabledProps = {
  /** The page's existing init event, so Pearl drops its loading spinner and shows this view. */
  initEventId: string;
  message: string;
};

/** Shown instead of a Web3Auth page while `WEB3AUTH_ENABLED` is off. Never initialises the SDK. */
export const Web3AuthDisabled = ({ initEventId, message }: Web3AuthDisabledProps) => {
  useEffect(() => {
    window.parent.postMessage({ event_id: initEventId }, '*');
  }, [initEventId]);

  return <Alert message={<Text>{message}</Text>} type="warning" showIcon style={{ margin: 16 }} />;
};
