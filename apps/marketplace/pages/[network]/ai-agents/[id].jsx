import dynamic from 'next/dynamic';

import { Meta } from '../../../components/Meta';
import { getServiceMetadataServerSide } from '../../../common-util/functions/serverSideMetadata';

const ServiceDetails = dynamic(() => import('../../../components/ListServices/details'), {
  ssr: false,
});

const AIAgentDetails = ({ agentMetadata, network, id }) => {
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
        network,
        id,
      },
    };
  } catch (error) {
    console.error('Error fetching agent metadata:', error);
    return {
      props: {
        agentMetadata: null,
        network,
        id,
      },
    };
  }
};

export default AIAgentDetails;
