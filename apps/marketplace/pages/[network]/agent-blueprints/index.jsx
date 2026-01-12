import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

import { Meta } from '../../../components/Meta';

const ListAgents = dynamic(() => import('../../../components/ListAgents'), {
  ssr: false,
});

const AgentBlueprints = () => {
  const router = useRouter();
  const { network } = router.query;

  return (
    <>
      <Meta
        pageTitle="Agent Blueprints"
        description="Browse agent blueprints in the Olas registry. Discover templates and designs for building autonomous AI agents."
        pageUrl={`${network || ''}/agent-blueprints`}
      />
      <ListAgents />
    </>
  );
};

export default AgentBlueprints;
