import dynamic from 'next/dynamic';
import { Meta } from '../../../components/Meta';

const ListAgents = dynamic(() => import('../../../components/ListAgents'), {
  ssr: false,
});

const AgentBlueprints = () => (
  <>
    <Meta
      pageTitle="Agent Blueprints"
      description="Browse agent blueprints in the Olas registry. Discover templates and designs for building autonomous AI agents."
      pageUrl="agent-blueprints"
    />
    <ListAgents />
  </>
);

export default AgentBlueprints;
