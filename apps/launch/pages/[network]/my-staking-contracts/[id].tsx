import { useRouter } from 'next/router';

import { Meta } from 'components/Meta';
import { Details } from 'components/MyStakingContracts/Details';

const StakingContractDetails = () => {
  const router = useRouter();
  const { network, id } = router.query;

  return (
    <>
      <Meta
        pageTitle="Staking Contract Details"
        description="View detailed information about your staking contract. Monitor staking activity, rewards distribution, and manage contract settings."
        pageUrl={`${network || ''}/my-staking-contracts/${id || ''}`}
      />
      <Details />
    </>
  );
};

export default StakingContractDetails;
