import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

import { Meta } from '../../../components/Meta';

const AgentDetails = dynamic(() => import('../../../components/ListAgents/details'), {
  ssr: false,
});

const AgentBlueprintDetails = () => {
  const router = useRouter();
  const { network, id } = router.query;

  return (
    <>
      <Meta
        pageTitle="Agent Blueprint Details"
        description="View detailed information about this agent blueprint including its specification, dependencies, and on-chain registration."
        pageUrl={`${network || ''}/agent-blueprints/${id || ''}`}
      />
      <AgentDetails />
    </>
  );
};

export default AgentBlueprintDetails;
