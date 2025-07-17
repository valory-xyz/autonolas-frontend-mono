import { useAppSelector } from 'store/index';
import { useClaimableNomineesBatches } from 'hooks/useClaimableSet';

export const ClaimStakingIncentives = () => {
  const nominees = useAppSelector((state) => state.govern.stakingContracts);
  const claimableNomineesBatches = useClaimableNomineesBatches({ nominees });

  console.log(claimableNomineesBatches);

  return <div>ClaimStakingIncentives</div>;
};
