import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

import { Meta } from '../../../components/Meta';
import { getServiceMetadataServerSide } from '../../../common-util/functions/serverSideMetadata';

const ServiceDetails = dynamic(() => import('../../../components/ListServices/details'), {
  ssr: false,
});

const AIAgentDetails = ({ agentMetadata }) => {
  const router = useRouter();
  const { network, id } = router.query;

  const pageTitle = agentMetadata?.name
    ? `${agentMetadata.name} - AI Agent #${id}`
    : `AI Agent #${id}`;

  const description =
    agentMetadata?.description ||
    'View detailed information about this AI agent including its configuration, activity, and on-chain registration details.';

  return (
    <>
      <Meta
        pageTitle={pageTitle}
        description={description}
        pageUrl={`${network || ''}/ai-agents/${id || ''}`}
        imageUrl={agentMetadata?.imageUrl}
      />
      <ServiceDetails />
    </>
  );
};

export const getServerSideProps = async (context) => {
  const { network, id } = context.params;

  try {
    const agentMetadata = await getServiceMetadataServerSide(network, id);

    return {
      props: {
        agentMetadata,
      },
    };
  } catch (error) {
    console.error('Error fetching agent metadata:', error);
    return {
      props: {
        agentMetadata: null,
      },
    };
  }
};

export default AIAgentDetails;
