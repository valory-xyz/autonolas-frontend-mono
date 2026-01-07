import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

import { Meta } from '../../../../components/Meta';

const UpdateService = dynamic(() => import('../../../../components/ListServices/update'), {
  ssr: false,
});

const UpdateAIAgent = () => {
  const router = useRouter();
  const { network, id } = router.query;

  return (
    <>
      <Meta
        pageTitle="Update AI Agent"
        description="Update your AI agent's on-chain configuration. Modify agent parameters, metadata, and settings in the Olas registry."
        pageUrl={`${network || ''}/ai-agents/update/${id || ''}`}
      />
      <UpdateService />
    </>
  );
};

export default UpdateAIAgent;
