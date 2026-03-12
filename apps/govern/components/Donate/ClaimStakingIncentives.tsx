import { useState } from 'react';
import { Button, Flex } from 'antd';
import { useAccount } from 'wagmi';

import { ClaimStakingIncentivesModal } from './ClaimStakingIncentivesModal';

export const ClaimStakingIncentives = () => {
  const { isConnected: isAccountConnected } = useAccount();

  const [showModal, setShowModal] = useState(false);

  const handleShowModal = () => setShowModal((state) => !state);

  return (
    <Flex gap={8} vertical style={{ marginTop: 16 }}>
      <Button
        onClick={handleShowModal}
        disabled={!isAccountConnected}
        type="primary"
        size="large"
        style={{ width: 'fit-content' }}
      >
        {showModal ? 'Claiming...' : 'Claim Staking Incentives'}
      </Button>
      {showModal && <ClaimStakingIncentivesModal onClose={handleShowModal} />}
    </Flex>
  );
};
