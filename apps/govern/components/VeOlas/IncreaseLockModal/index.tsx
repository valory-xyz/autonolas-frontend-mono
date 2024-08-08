import { Modal, Segmented } from 'antd';
import { useState } from 'react';

import { IncreaseAmount } from './IncreaseAmount';
import { IncreaseUnlockTime } from './IncreaseUnlockTime';

const TABS = { by_olas_amount: 'By OLAS Amount', by_lock_duration: 'By Lock Duration' };
const TABS_OPTIONS = Object.values(TABS);

type IncreaseLockModalProps = {
  isModalVisible: boolean;
  setIsModalVisible: (value: boolean) => void;
};

export const IncreaseLockModal = ({
  isModalVisible,
  setIsModalVisible,
}: IncreaseLockModalProps) => {
  const [selectedTab, setSelectedTab] = useState(TABS_OPTIONS[0]);
  const handleClose = () => {
    setIsModalVisible(false);
  };

  return (
    <Modal
      title="Increase Lock"
      open={isModalVisible}
      footer={null}
      onCancel={handleClose}
      destroyOnClose
    >
      <Segmented
        options={TABS_OPTIONS}
        value={selectedTab}
        onChange={setSelectedTab}
        size="large"
        className="mt-16"
      />

      {selectedTab == TABS.by_olas_amount && <IncreaseAmount closeModal={handleClose} />}
      {selectedTab == TABS.by_lock_duration && <IncreaseUnlockTime closeModal={handleClose} />}
    </Modal>
  );
};
