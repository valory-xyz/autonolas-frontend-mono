import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

import { Meta } from '../../../components/Meta';
import { getAgentMetadataServerSide } from '../../../common-util/functions/serverSideMetadata';

const AgentDetails = dynamic(() => import('../../../components/ListAgents/details'), {
  ssr: false,
});

const AgentBlueprintDetails = ({ agentMetadata }) => {
  const router = useRouter();
  const { network, id } = router.query;

  const pageTitle = agentMetadata?.name
    ? `${agentMetadata.name} - Agent Blueprint #${id}`
    : `Agent Blueprint #${id}`;

  const description =
    agentMetadata?.description ||
    'View detailed information about this agent blueprint including its specification, dependencies, and on-chain registration.';

  return (
    <>
      <Meta
        pageTitle={pageTitle}
        description={description}
        pageUrl={`${network || ''}/agent-blueprints/${id || ''}`}
        imageUrl={agentMetadata?.imageUrl}
      />
      <AgentDetails />
    </>
  );
};

export const getServerSideProps = async (context) => {
  const { network, id } = context.params;

  try {
    const agentMetadata = await getAgentMetadataServerSide(network, id);

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

export default AgentBlueprintDetails;
