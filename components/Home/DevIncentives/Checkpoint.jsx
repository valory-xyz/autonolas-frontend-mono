import { useState, useEffect } from 'react';
import { Alert, Button, Typography } from 'antd/lib';
import { notifySpecificError } from 'common-util/functions';
import { useHelpers } from 'common-util/hooks/useHelpers';
import { canShowCheckpoint, checkpointRequest } from './requests';
import { CheckpointContainer } from './styles';

const { Title } = Typography;

export const Checkpoint = () => {
  const { account, chainId } = useHelpers();

  const [isLoading, setIsLoading] = useState(false);
  const [isCheckpointVisible, setIsCheckpointVisible] = useState(false);

  const getIfCheckpointVisible = async () => {
    const value = await canShowCheckpoint({
      account,
      chainId,
    });
    setIsCheckpointVisible(value);
  };

  // check if checkpoint is visible on load
  useEffect(() => {
    if (account && chainId) {
      getIfCheckpointVisible();
    }
  }, [account, chainId]);

  // checkpoint call on button click
  const onCheckpointCall = async () => {
    try {
      setIsLoading(true);

      await checkpointRequest({
        account,
        chainId,
      });

      // check if checkpoint is visible again
      await getIfCheckpointVisible();
    } catch (error) {
      notifySpecificError(error);
      window.console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isCheckpointVisible) return null;

  return (
    <CheckpointContainer>
      <Title level={5}>
        A new epoch can start, in order to be able to claim your incentives call
        the checkpoint
      </Title>

      <div className="btn-container">
        <Button type="primary" onClick={onCheckpointCall} loading={isLoading}>
          Checkpoint
        </Button>
      </div>

      <Alert
        message="Note that this will trigger a transaction"
        type="info"
        className="mt-16"
      />

      <br />
      <br />
    </CheckpointContainer>
  );
};
