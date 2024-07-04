import { Alert, Modal, Typography } from 'antd';

import { MAX_ALLOCATED_POWER } from './utils';

const { Paragraph } = Typography;

export const ConfirmModal = ({
  isOpen,
  handleOk,
  handleClose,
  isLoading,
  allocationsLength,
  allocatedPower,
}: {
  isOpen: boolean;
  handleOk: () => void;
  handleClose: () => void;
  isLoading: boolean;
  allocationsLength: number;
  allocatedPower: number;
}) => {
  return (
    <Modal
      title="Confirm voting weight update"
      open={isOpen}
      onOk={handleOk}
      onCancel={handleClose}
      cancelText="Cancel"
      okText="Confirm voting weight"
      confirmLoading={isLoading}
    >
      <Paragraph>
        {`You're allocating ${parseFloat(
          (allocatedPower / 100).toFixed(2),
        )}% of your voting power to ${allocationsLength} staking contracts.`}
      </Paragraph>
      <Paragraph>
        {`After you confirm, you'll enter a 10 day cooldown period. You won't be able to update your weights during that time.`}
      </Paragraph>

      {allocatedPower < MAX_ALLOCATED_POWER && (
        <Alert
          // TODO: add blue info alerts as in Pearl
          className="mb-16"
          message={`${parseFloat(
            ((MAX_ALLOCATED_POWER - allocatedPower) / 100).toFixed(2),
          )}% of your voting power is unallocated - this will be applied to the Rollover Pool and may be used in future epochs.`}
          showIcon
        />
      )}
    </Modal>
  );
};
