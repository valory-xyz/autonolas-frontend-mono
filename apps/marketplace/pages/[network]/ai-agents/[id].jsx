import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

import { Meta } from '../../../components/Meta';
import { getServiceMetadataServerSide } from '../../../common-util/functions/serverSideMetadata';

const ServiceDetails = dynamic(() => import('../../../components/ListServices/details'), {
  ssr: false,
});
const MintService = dynamic(() => import('../../../components/ListServices/mint'), {
  ssr: false,
});

// Vercel's Next 16 serverless adapter intermittently mis-routes the
// client-side `_next/data/.../mint.json` request for `/[network]/ai-agents/mint`
// to this [id] function with id="mint" instead of the sibling static
// `mint.jsx`. Rendering the mint form here when id === "mint" keeps the
// page correct regardless of which function Vercel picks.
const MINT_SLUG = 'mint';

const AIAgentDetails = ({ agentMetadata }) => {
  const router = useRouter();
  const { network, id } = router.query;

  if (id === MINT_SLUG) {
    return (
      <>
        <Meta
          pageTitle="Mint AI Agent"
          description="Register a new AI agent on-chain. Mint your autonomous agent to the Olas registry and make it discoverable in the marketplace."
          pageUrl={`${network || ''}/ai-agents/mint`}
        />
        <MintService />
      </>
    );
  }

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

  if (id === MINT_SLUG) {
    return { props: { agentMetadata: null } };
  }

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
