import dynamic from 'next/dynamic';

import { Meta } from '../../../components/Meta';
import { getComponentMetadataServerSide } from '../../../common-util/functions/serverSideMetadata';

const ComponentDetails = dynamic(() => import('../../../components/ListComponents/details'), {
  ssr: false,
});

const ComponentDetailsPage = ({ componentMetadata, network, id }) => {
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

  try {
    const componentMetadata = await getComponentMetadataServerSide(network, id);

    return {
      props: {
        componentMetadata,
        network,
        id,
      },
    };
  } catch (error) {
    console.error('Error fetching component metadata:', error);
    return {
      props: {
        componentMetadata: null,
        network,
        id,
      },
    };
  }
};

export default ComponentDetailsPage;
