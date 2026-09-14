import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

import { Meta } from '../../../components/Meta';
import { getNetworkDisplayName } from '../../../common-util/functions';
import { fetchServices } from '../../../common-util/functions/fetchListings';
import {
  createListingStaticProps,
  listingStaticPaths,
} from '../../../common-util/functions/createListingStaticProps';
import { ListingSummary } from '../../../components/ListingSummary';

const ListServices = dynamic(() => import('../../../components/ListServices'), {
  ssr: false,
});

export const getStaticPaths = listingStaticPaths;

export const getStaticProps = createListingStaticProps({
  fetchSnapshot: fetchServices,
  label: 'marketplace/ai-agents',
});

const AIAgents = ({ initialUnits, snapshotGeneratedAt }) => {
  const router = useRouter();
  const { network } = router.query;
  const networkName = getNetworkDisplayName(network);

  return (
    <>
      <Meta
        pageTitle={networkName ? `AI Agents on ${networkName}` : 'AI Agents'}
        description="Explore autonomous AI agents registered on-chain. Browse, discover, and view activity of AI agents from the Olas marketplace."
        pageUrl={`${network || ''}/ai-agents`}
      />
      <ListingSummary
        units={initialUnits}
        label="AI agents"
        snapshotGeneratedAt={snapshotGeneratedAt}
      />
      <ListServices />
    </>
  );
};

export default AIAgents;
