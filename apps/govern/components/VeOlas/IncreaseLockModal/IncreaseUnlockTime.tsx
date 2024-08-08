import { Button, Divider, Flex, Form } from 'antd';
import { useState } from 'react';

import { notifyError, notifySuccess } from 'libs/util-functions/src';

import {
  dateInMs,
  getRemainingTimeInSeconds,
  updateIncreaseUnlockTime,
} from 'common-util/functions';
import { useFetchBalances } from 'hooks/useFetchBalances';

import { ProjectedVeOlas } from '../ProjectedVeOlas';
import { UnlockTimeInput } from '../UnlockTimeInput';
import { useVeolasComponents } from '../useVeolasComponents';

type IncreaseUnlockTimeProps = {
  closeModal: () => void;
};

type FormValues = {
  unlockTime: number;
};

export const IncreaseUnlockTime = ({ closeModal }: IncreaseUnlockTimeProps) => {
  const [form] = Form.useForm();
  const { account, lockedEnd, olasBalance, veOlasBalance, refetch } = useFetchBalances();
  const { getUnlockTimeComponent } = useVeolasComponents();

  const [isLoading, setIsLoading] = useState(false);

  const unlockTime = dateInMs(Form.useWatch('unlockTime', form));

  const onFinish = async ({ unlockTime }: FormValues) => {
    if (!account) return;
    if (!veOlasBalance) return;

    try {
      setIsLoading(true);

      const txHash = await updateIncreaseUnlockTime({
        time: getRemainingTimeInSeconds(unlockTime),
        account,
      });

      notifySuccess('Unlock time increased successfully!', `Transaction Hash: ${txHash}`);

      // once the unlockTime is increased, refetch the data
      refetch();

      // close the modal after successful locking & loading state
      closeModal();
    } catch (error) {
      window.console.error(error);
      notifyError();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * can increase amount only if the mapped amount is zero (ie. no lock exists)
   * or if the user has some olas tokens.
   */
  const cannotIncreaseAmount = Number(veOlasBalance) === 0 || Number(olasBalance) === 0 || !account;

  return (
    <Form
      form={form}
      layout="vertical"
      autoComplete="off"
      name="increase-unlock-time-form"
      requiredMark={false}
      onFinish={onFinish}
    >
      {getUnlockTimeComponent()}

      <Divider className="mt-8" />

      <div className="mb-12">
        <UnlockTimeInput startDate={lockedEnd} />
      </div>

      <Divider className="mb-8" />

      <ProjectedVeOlas
        olasAmount={veOlasBalance ? Number(veOlasBalance) : undefined}
        unlockTime={unlockTime}
      />

      <Divider className="mt-8" />

      <Flex gap={12} justify="end" className="mb-4">
        <Button type="default" onClick={closeModal} size="large">
          Cancel
        </Button>
        <Form.Item className="mb-0">
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            disabled={cannotIncreaseAmount}
            loading={isLoading}
          >
            Increase lock
          </Button>
        </Form.Item>
      </Flex>
    </Form>
  );
};
