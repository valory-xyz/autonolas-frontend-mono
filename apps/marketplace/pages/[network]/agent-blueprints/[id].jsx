import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

import { Meta } from '../../../components/Meta';
import { getAgentMetadataServerSide } from '../../../common-util/functions/serverSideMetadata';

const AgentDetails = dynamic(() => import('../../../components/ListAgents/details'), {
  ssr: false,
});
const MintAgent = dynamic(() => import('../../../components/ListAgents/mint'), {
  ssr: false,
});

const DEFAULT_DESCRIPTION =
  'View detailed information about this agent blueprint including its specification, dependencies, and on-chain registration.';

// See ai-agents/[id].jsx for the rationale on this id === "mint" branch.
const MINT_SLUG = 'mint';

const AgentBlueprintDetails = ({ agentMetadata }) => {
  const router = useRouter();
  const { network, id } = router.query;

  if (id === MINT_SLUG) {
    return (
      <>
        <Meta
          pageTitle="Mint Agent Blueprint"
          description="Register a new agent blueprint on-chain. Mint your agent template to the Olas registry for others to discover and use."
          pageUrl={`${network || ''}/agent-blueprints/mint`}
        />
        <MintAgent />
      </>
    );
  }

  const pageTitle = agentMetadata?.name
    ? `${agentMetadata.name} - Agent Blueprint #${id}`
    : `Agent Blueprint #${id}`;

  const description = agentMetadata?.description || DEFAULT_DESCRIPTION;
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

  if (id === MINT_SLUG) {
    return { props: { agentMetadata: null } };
  }

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
