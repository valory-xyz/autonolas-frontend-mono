import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

import { Meta } from '../../../components/Meta';
import { getComponentMetadataServerSide } from '../../../common-util/functions/serverSideMetadata';

const ComponentDetails = dynamic(() => import('../../../components/ListComponents/details'), {
  ssr: false,
});
const MintComponent = dynamic(() => import('../../../components/ListComponents/mint'), {
  ssr: false,
});

// See ai-agents/[id].jsx for the rationale on this id === "mint" branch.
const MINT_SLUG = 'mint';

const ComponentDetailsPage = ({ componentMetadata }) => {
  const router = useRouter();
  const { network, id } = router.query;

  if (id === MINT_SLUG) {
    return (
      <>
        <Meta
          pageTitle="Mint Component"
          description="Register a new component on-chain. Mint your reusable component to the Olas registry for others to discover and integrate."
          pageUrl={`${network || ''}/components/mint`}
        />
        <MintComponent />
      </>
    );
  }

  const pageTitle = componentMetadata?.name
    ? `${componentMetadata.name} - Component #${id}`
    : `Component #${id}`;

  const description =
    componentMetadata?.description ||
    'View detailed information about this component including its functionality, dependencies, and on-chain registration details.';

  return (
    <>
      <Meta
        pageTitle={pageTitle}
        description={description}
        pageUrl={`${network || ''}/components/${id || ''}`}
        imageUrl={componentMetadata?.imageUrl}
      />
      <ComponentDetails />
    </>
  );
};

export const getServerSideProps = async (context) => {
  const { network, id } = context.params;

  if (id === MINT_SLUG) {
    return { props: { componentMetadata: null } };
  }

  try {
    const componentMetadata = await getComponentMetadataServerSide(network, id);

    return {
      props: {
        componentMetadata,
      },
    };
  } catch (error) {
    console.error('Error fetching component metadata:', error);
    return {
      props: {
        componentMetadata: null,
      },
    };
  }
};

export default ComponentDetailsPage;
