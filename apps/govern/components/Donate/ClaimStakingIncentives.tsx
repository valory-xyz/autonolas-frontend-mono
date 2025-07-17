import { Button } from 'antd';

import { useClaimableNomineesBatches } from 'hooks/useClaimableSet';
import { useClaimStakingIncentivesBatch } from 'hooks/useClaimStakingIncentivesBatch';
import { useAppSelector } from 'store/index';

export const ClaimStakingIncentives = () => {
  const nominees = useAppSelector((state) => state.govern.stakingContracts);
  const { nomineesToClaimBatches, isLoadingClaimableBatches } = useClaimableNomineesBatches({
    nominees,
  });
  const { claimBatch, isPending } = useClaimStakingIncentivesBatch();

  const handleClaim = async () => {
    if (!nomineesToClaimBatches.length) return;

    try {
      const batch = nomineesToClaimBatches[0];
      await claimBatch(batch);
    } catch (error) {
      console.error('Error claiming batch:', error);
    }
  };

  const hasClaimableBatches = nomineesToClaimBatches.length > 0;
  const isDisabled = !hasClaimableBatches || isPending || isLoadingClaimableBatches;

  return (
    <div>
      <Button onClick={handleClaim} disabled={isDisabled} loading={isPending}>
        {isPending
          ? 'Claiming...'
          : isLoadingClaimableBatches
            ? 'Calculating claimable batches...'
            : 'Claim Staking Incentives'}
      </Button>
      {isLoadingClaimableBatches && (
        <p style={{ marginTop: 8, fontSize: '14px', color: '#666' }}>
          Calculating which nominees can be claimed...
        </p>
      )}
      {!isLoadingClaimableBatches && !hasClaimableBatches && (
        <p style={{ marginTop: 8, fontSize: '14px', color: '#666' }}>
          No claimable staking incentives available
        </p>
      )}
    </div>
  );
};
