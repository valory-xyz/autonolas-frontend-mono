import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

import { Meta } from '../../../components/Meta';
import { fetchComponents } from '../../../common-util/functions/fetchListings';
import {
  createListingStaticProps,
  listingStaticPaths,
} from '../../../common-util/functions/createListingStaticProps';
import { ListingSummary } from '../../../components/ListingSummary';

const ListComponents = dynamic(() => import('../../../components/ListComponents'), {
  ssr: false,
});

export const getStaticPaths = listingStaticPaths;

export const getStaticProps = createListingStaticProps({
  fetchSnapshot: fetchComponents,
  label: 'marketplace/components',
});

const Components = ({ initialUnits, snapshotGeneratedAt }) => {
  const router = useRouter();
  const { network } = router.query;

  return (
    <>
      <Meta
        pageTitle="Components"
        description="Browse reusable components in the Olas registry. Discover building blocks for creating autonomous AI agents."
        pageUrl={`${network || ''}/components`}
      />
      <ListingSummary
        units={initialUnits}
        label="components"
        snapshotGeneratedAt={snapshotGeneratedAt}
      />
      <ListComponents />
    </>
  );
};

export default Components;
