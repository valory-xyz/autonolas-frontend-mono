import { Button, Typography } from 'antd/lib';
import { notifyError, notifySuccess } from 'common-util/functions';
import { createBuolasLockRequest, approveOlasByOwner } from '../contractUtils';
import { useFetchBuolasBalances } from '../hooks';
import { CreateLockContainer } from '../styles';

const { Title } = Typography;

export const BuolasCreateLock = () => {
  const { account, chainId, getData } = useFetchBuolasBalances();

  const onFinish = async () => {
    try {
      await approveOlasByOwner({ account, chainId });

      const txHash = await createBuolasLockRequest({
        account,
        chainId,
      });
      notifySuccess(
        'Lock created successfully!',
        `Transaction Hash: ${txHash}`,
      );

      // fetch the data again
      getData();
    } catch (error) {
      window.console.error(error);
      notifyError();
    }
  };

  return (
    <CreateLockContainer>
      <Title level={3}>Create Lock</Title>

      <Button
        type="primary"
        htmlType="submit"
        disabled={!account}
        onClick={onFinish}
      >
        Create Lock
      </Button>
    </CreateLockContainer>
  );
};
