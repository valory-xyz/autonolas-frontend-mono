import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

import { Meta } from '../../../components/Meta';
import { fetchAgentBlueprints } from '../../../common-util/functions/fetchListings';
import {
  createListingStaticProps,
  listingStaticPaths,
} from '../../../common-util/functions/createListingStaticProps';
import { ListingSummary } from '../../../components/ListingSummary';

const ListAgents = dynamic(() => import('../../../components/ListAgents'), {
  ssr: false,
});

export const getStaticPaths = listingStaticPaths;

export const getStaticProps = createListingStaticProps({
  fetchSnapshot: fetchAgentBlueprints,
  label: 'marketplace/agent-blueprints',
});

const AgentBlueprints = ({ initialUnits, snapshotGeneratedAt }) => {
  const router = useRouter();
  const { network } = router.query;

  return (
    <>
      <Meta
        pageTitle="Agent Blueprints"
        description="Browse agent blueprints in the Olas registry. Discover templates and designs for building autonomous AI agents."
        pageUrl={`${network || ''}/agent-blueprints`}
      />
      <ListingSummary
        units={initialUnits}
        label="agent blueprints"
        snapshotGeneratedAt={snapshotGeneratedAt}
      />
      <ListAgents />
    </>
  );
};

export default AgentBlueprints;
