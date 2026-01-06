import { Meta } from 'components/Meta';
import { MyStakingContracts } from 'components/MyStakingContracts';

const MyStakingContractsPage = () => (
  <>
    <Meta
      pageTitle="My Staking Contracts"
      description="View and manage your staking contracts for AI agent services. Monitor performance, rewards, and configure staking parameters for your deployed agents."
      pageUrl="my-staking-contracts"
    />
    <MyStakingContracts />
  </>
);

export default MyStakingContractsPage;
