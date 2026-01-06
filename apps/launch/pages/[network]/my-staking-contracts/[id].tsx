import { Meta } from 'components/Meta';
import { Details } from 'components/MyStakingContracts/Details';

const StakingContractDetails = () => (
  <>
    <Meta
      pageTitle="Staking Contract Details"
      description="View detailed information about your staking contract. Monitor staking activity, rewards distribution, and manage contract settings."
      pageUrl="my-staking-contracts"
    />
    <Details />
  </>
);

export default StakingContractDetails;
