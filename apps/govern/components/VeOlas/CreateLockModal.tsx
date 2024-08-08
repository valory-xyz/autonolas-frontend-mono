import { Alert, Button, Divider, Flex, Form, Modal } from 'antd';
import { ethers } from 'ethers';
import { useState } from 'react';

import { notifyError, notifySuccess } from 'libs/util-functions/src';

import {
  createLockRequest,
  dateInMs,
  getRemainingTimeInSeconds,
  hasSufficientTokensRequest,
} from 'common-util/functions';
import { useFetchBalances } from 'hooks/useFetchBalances';

import { ApproveOlasModal } from './ApproveOlasModal';
import { MaxButton } from './MaxButton';
import { OlasAmountInput } from './OlasAmountInput';
import { ProjectedVeOlas } from './ProjectedVeOlas';
import { UnlockTimeInput } from './UnlockTimeInput';

type CreateLockModalProps = {
  isModalVisible: boolean;
  setIsModalVisible: (value: boolean) => void;
};

type FormValues = {
  amount: number;
  unlockTime: number;
};

export const CreateLockModal = ({ isModalVisible, setIsModalVisible }: CreateLockModalProps) => {
  const [form] = Form.useForm();
  const { account, lockedEnd, olasBalance, veOlasBalance, refetch } = useFetchBalances();

  const [isLoading, setIsLoading] = useState(false);
  const [isApproveModalVisible, setIsApproveModalVisible] = useState(false);

  const amountInEth = Form.useWatch('amount', form);
  const unlockTime = dateInMs(Form.useWatch('unlockTime', form));

  const handleClose = () => {
    setIsModalVisible(false);
  };

  const onCreateLock = async () => {
    if (!account) return;

    setIsLoading(true);

    const txHash = await createLockRequest({
      amount: ethers.parseUnits(`${amountInEth}`, 18).toString(),
      unlockTime: getRemainingTimeInSeconds(unlockTime),
      account,
    });

    notifySuccess('Lock created successfully!', `Transaction Hash: ${txHash}`);

    // once the lock is created, refetch the data
    refetch();

    handleClose();
    setIsLoading(false);
  };

  const onFinish = async ({ amount }: FormValues) => {
    if (!account) return;

    try {
      setIsLoading(true);

      const hasSufficientTokens = await hasSufficientTokensRequest({
        account,
        amount,
      });

      if (!hasSufficientTokens) {
        setIsLoading(false);
        setIsApproveModalVisible(true);
        return;
      }

      await onCreateLock();
    } catch (error) {
      window.console.error(error);
      notifyError();
    } finally {
      setIsLoading(false);
    }
  };

  const cannotCreateLock = veOlasBalance !== undefined && Number(veOlasBalance) !== 0;

  return (
    <Modal
      title="Lock OLAS for veOLAS"
      open={isModalVisible}
      footer={null}
      onCancel={handleClose}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
        name="create-lock-form"
        requiredMark={false}
        onFinish={onFinish}
      >
        <div className="mb-24">
          <OlasAmountInput olasBalance={olasBalance} />
          <MaxButton
            olasBalance={olasBalance}
            onMaxClick={() => {
              form.setFieldsValue({ amount: olasBalance });
              form.validateFields(['amount']);
            }}
          />
        </div>

        <UnlockTimeInput startDate={lockedEnd} />

        <Divider className="mb-8" />

        <ProjectedVeOlas olasAmount={amountInEth} unlockTime={unlockTime} />

        <Divider className="mt-8" />

        <Flex gap={12} justify="end" className="mb-4">
          <Button type="default" onClick={handleClose} size="large">
            Cancel
          </Button>
          <Form.Item className="mb-0">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              disabled={cannotCreateLock || !account}
              loading={isLoading}
            >
              Lock
            </Button>
          </Form.Item>
        </Flex>
      </Form>

      {!account && (
        <Alert message="To add, first connect wallet" type="warning" className="mt-16" />
      )}

      {cannotCreateLock && (
        <Alert
          message="Amount already locked, please wait until the lock expires."
          type="warning"
          className="mt-16"
        />
      )}

      <ApproveOlasModal
        isModalVisible={isApproveModalVisible}
        setIsModalVisible={setIsApproveModalVisible}
        amountInEth={amountInEth}
        onApprove={onCreateLock}
      />
    </Modal>
  );
};
