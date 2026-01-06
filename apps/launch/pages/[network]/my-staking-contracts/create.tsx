import { Meta } from 'components/Meta';
import { CreateStakingContract } from 'components/MyStakingContracts/Create';

const Create = () => (
  <>
    <Meta
      pageTitle="Create Staking Contract"
      description="Create a new staking contract for your AI agent service. Configure reward parameters, eligibility criteria, and deployment settings."
      pageUrl="my-staking-contracts/create"
    />
    <CreateStakingContract />
  </>
);

export default Create;
