import { Button, Divider, Flex, Form } from 'antd';
import { ethers } from 'ethers';
import { useState } from 'react';

import { notifyError, notifySuccess } from 'libs/util-functions/src';

import { hasSufficientTokensRequest, updateIncreaseAmount } from 'common-util/functions';
import { useFetchBalances } from 'hooks/useFetchBalances';

import { ApproveOlasModal } from '../ApproveOlasModal';
import { MaxButton } from '../MaxButton';
import { OlasAmountInput } from '../OlasAmountInput';
import { ProjectedVeOlas } from '../ProjectedVeOlas';
import { useVeolasComponents } from '../useVeolasComponents';

type IncreaseAmountProps = {
  closeModal: () => void;
};

type FormValues = {
  amount: number;
};

export const IncreaseAmount = ({ closeModal }: IncreaseAmountProps) => {
  const [form] = Form.useForm();
  const { account, lockedEnd, olasBalance, veOlasBalance, refetch } = useFetchBalances();
  const { getLockedAmountComponent } = useVeolasComponents();

  const [isLoading, setIsLoading] = useState(false);
  const [isApproveModalVisible, setIsApproveModalVisible] = useState(false);

  const amountInEth = Form.useWatch('amount', form);

  const onIncreaseAmount = async () => {
    if (!account) return;

    setIsLoading(true);

    const txHash = await updateIncreaseAmount({
      amount: ethers.parseUnits(`${amountInEth}`, 18).toString(),
      account,
    });

    notifySuccess('Amount increased successfully!', `Transaction Hash: ${txHash}`);

    // once the amount is increased, refetch the data
    refetch();

    closeModal();
    setIsLoading(false);
  };

  const onFinish = async ({ amount }: FormValues) => {
    if (!account) return;
    if (!veOlasBalance) return;

    try {
      setIsLoading(true);

      await form.validateFields();
      const hasSufficientTokens = await hasSufficientTokensRequest({
        account,
        amount,
      });

      if (!hasSufficientTokens) {
        setIsLoading(false);
        setIsApproveModalVisible(true);
        return;
      }

      await onIncreaseAmount();
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
    <>
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
        name="increase-amount-form"
        requiredMark={false}
        onFinish={onFinish}
      >
        {getLockedAmountComponent()}

        <Divider className="mt-8" />

        <div className="mb-12">
          <OlasAmountInput olasBalance={olasBalance} />
          <MaxButton
            olasBalance={olasBalance}
            onMaxClick={() => {
              form.setFieldsValue({ amount: olasBalance });
              form.validateFields(['amount']);
            }}
          />
        </div>

        <Divider className="mb-8" />

        <ProjectedVeOlas olasAmount={amountInEth} unlockTime={lockedEnd} />

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

      <ApproveOlasModal
        isModalVisible={isApproveModalVisible}
        setIsModalVisible={setIsApproveModalVisible}
        amountInEth={amountInEth}
        onApprove={onIncreaseAmount}
      />
    </>
  );
};
