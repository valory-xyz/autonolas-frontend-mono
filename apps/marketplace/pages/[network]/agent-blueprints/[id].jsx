import dynamic from 'next/dynamic';
import { Meta } from '../../../components/Meta';

const AgentDetails = dynamic(() => import('../../../components/ListAgents/details'), {
  ssr: false,
});

const AgentBlueprintDetails = () => (
  <>
    <Meta
      pageTitle="Agent Blueprint Details"
      description="View detailed information about this agent blueprint including its specification, dependencies, and on-chain registration."
      pageUrl="agent-blueprints"
    />
    <AgentDetails />
  </>
);

export default AgentBlueprintDetails;
