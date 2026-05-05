import { useRouter } from 'next/router';

import { Meta } from 'components/Meta';
import { CreateStakingContract } from 'components/MyStakingContracts/Create';
import { Details } from 'components/MyStakingContracts/Details';

// Vercel's Next 16 serverless adapter intermittently mis-routes the
// client-side `_next/data/.../create.json` request for
// `/[network]/my-staking-contracts/create` to this [id] function with
// id="create" instead of the sibling static `create.tsx`. Rendering the
// create form here when id === "create" keeps the page correct
// regardless of which function Vercel picks.
const CREATE_SLUG = 'create';

const StakingContractDetails = () => {
  const router = useRouter();
  const { network, id } = router.query;

  if (id === CREATE_SLUG) {
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
  }

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
