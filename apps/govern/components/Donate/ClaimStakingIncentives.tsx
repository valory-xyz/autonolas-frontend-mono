import { useState } from 'react';
import { Button, Flex, Typography } from 'antd';

import { useClaimableNomineesBatches } from 'hooks/useClaimableSet';
import { ClaimStakingIncentivesModal } from './ClaimStakingIncentivesModal';

const { Text } = Typography;

export const ClaimStakingIncentives = () => {
  const { nomineesToClaimBatches, isLoadingClaimableBatches } = useClaimableNomineesBatches();
  const [showModal, setShowModal] = useState(false);

  const handleShowModal = () => setShowModal((state) => !state);

  const hasClaimableBatches = nomineesToClaimBatches.length > 0;
  const isDisabled = !hasClaimableBatches || isLoadingClaimableBatches;
  return (
    <Flex gap={8} vertical style={{ marginTop: 16 }}>
      {isLoadingClaimableBatches && (
        <Text>Calculating which staking contracts can be claimed...</Text>
      )}
      {!isLoadingClaimableBatches && !hasClaimableBatches && (
        <Text>No claimable staking incentives available.</Text>
      )}
      <Button
        onClick={handleShowModal}
        disabled={isDisabled}
        loading={isLoadingClaimableBatches || showModal}
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
