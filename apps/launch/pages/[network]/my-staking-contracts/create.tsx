import { useRouter } from 'next/router';

import { Meta } from 'components/Meta';
import { CreateStakingContract } from 'components/MyStakingContracts/Create';

const Create = () => {
  const router = useRouter();
  const { network } = router.query;

  return (
    <>
      <Meta
        pageTitle="Create Staking Contract"
        description="Create a new staking contract for your AI agent service. Configure reward parameters, eligibility criteria, and deployment settings."
        pageUrl={`${network || ''}/my-staking-contracts/create`}
      />
      <CreateStakingContract />
    </>
  );
};

export default Create;
