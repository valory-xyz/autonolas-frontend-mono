import dynamic from 'next/dynamic';
import { Meta } from '../../../../components/Meta';

const UpdateService = dynamic(() => import('../../../../components/ListServices/update'), {
  ssr: false,
});

const UpdateAIAgent = () => (
  <>
    <Meta
      pageTitle="Update AI Agent"
      description="Update your AI agent's on-chain configuration. Modify agent parameters, metadata, and settings in the Olas registry."
      pageUrl="ai-agents/update"
    />
    <UpdateService />
  </>
);

export default UpdateAIAgent;
