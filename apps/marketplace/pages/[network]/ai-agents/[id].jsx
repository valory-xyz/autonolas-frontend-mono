import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

import { Meta } from '../../../components/Meta';

const ServiceDetails = dynamic(() => import('../../../components/ListServices/details'), {
  ssr: false,
});

const AIAgentDetails = () => {
  const router = useRouter();
  const { network, id } = router.query;

  return (
    <>
      <Meta
        pageTitle="AI Agent Details"
        description="View detailed information about this AI agent including its configuration, activity, and on-chain registration details."
        pageUrl={`${network || ''}/ai-agents/${id || ''}`}
      />
      <ServiceDetails />
    </>
  );
};

export default AIAgentDetails;
