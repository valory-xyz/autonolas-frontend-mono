import dynamic from 'next/dynamic';
import { Meta } from '../../../components/Meta';

const ServiceDetails = dynamic(() => import('../../../components/ListServices/details'), {
  ssr: false,
});

const AIAgentDetails = () => (
  <>
    <Meta
      pageTitle="AI Agent Details"
      description="View detailed information about this AI agent including its configuration, activity, and on-chain registration details."
      pageUrl="ai-agents"
    />
    <ServiceDetails />
  </>
);

export default AIAgentDetails;
