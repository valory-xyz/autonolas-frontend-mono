import { Meta } from 'components/Meta';
import { AgentsPage } from 'components/Agents';

const Agents = () => (
  <>
    <Meta
      pageTitle="AI Agents"
      description="Discover and run AI agents in the Olas ecosystem. Browse available autonomous agents, stake your assets, and start earning rewards as an Operator."
      pageUrl="agents"
    />
    <AgentsPage />
  </>
);

export default Agents;
