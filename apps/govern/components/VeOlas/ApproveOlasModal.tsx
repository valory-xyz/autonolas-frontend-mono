import { Alert, Button, Flex, Modal } from 'antd';
import { ethers } from 'ethers';
import { useState } from 'react';
import { useAccount } from 'wagmi';

import { notifyError } from 'libs/util-functions/src';

import { approveOlasByOwner } from 'common-util/functions';

type CreateLockModalProps = {
  isModalVisible: boolean;
  setIsModalVisible: (value: boolean) => void;
  amountInEth: bigint;
  onApprove: () => void;
};

export const ApproveOlasModal = ({
  isModalVisible,
  setIsModalVisible,
  amountInEth,
  onApprove,
}: CreateLockModalProps) => {
  const { address } = useAccount();

  const [isApproving, setIsApproving] = useState(false);

  const handleApprove = async () => {
    if (!address) return;

    try {
      setIsApproving(true);
      const amountBN = ethers.parseUnits(`${amountInEth}`, 'ether');

      await approveOlasByOwner({
        account: address,
        amount: amountBN,
      });

      onApprove();
    } catch (error) {
      console.error(error);
      notifyError();
    } finally {
      setIsApproving(false);
      setIsModalVisible(false);
    }
  };

  return (
    <Modal
      title="Approve OLAS"
      open={isModalVisible}
      footer={null}
      onCancel={() => setIsModalVisible(false)}
    >
      <Alert
        className="mb-16"
        message="Before increasing the amount, an approval for OLAS is required. Please approve to proceed."
        type="warning"
      />

      <Flex justify="end">
        <Button
          type="primary"
          htmlType="submit"
          loading={isApproving}
          onClick={handleApprove}
          size="large"
        >
          Approve
        </Button>
      </Flex>
    </Modal>
  );
};
