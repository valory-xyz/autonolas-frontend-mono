import dynamic from 'next/dynamic';
import { Meta } from '../../../components/Meta';

const ListServices = dynamic(() => import('../../../components/ListServices'), {
  ssr: false,
});

const AIAgents = () => (
  <>
    <Meta
      pageTitle="AI Agents"
      description="Explore autonomous AI agents registered on-chain. Browse, discover, and view activity of AI agents from the Olas marketplace."
      pageUrl="ai-agents"
    />
    <ListServices />
  </>
);

export default AIAgents;
