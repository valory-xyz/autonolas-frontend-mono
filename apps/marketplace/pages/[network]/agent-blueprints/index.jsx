import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

import { createSnapshotGetStaticProps } from 'libs/util-ssr/src';

import { Meta } from '../../../components/Meta';
import { fetchAgentBlueprints } from '../../../common-util/functions/fetchListings';
import { EVM_SUPPORTED_CHAINS } from '../../../common-util/Login/config';
import { ListingSummary } from '../../../components/ListingSummary';

const ListAgents = dynamic(() => import('../../../components/ListAgents'), {
  ssr: false,
});

const ISR_TIMEOUT_MS = 20_000;
const REVALIDATE_SECONDS = 300;
const REVALIDATE_ON_ERROR_SECONDS = 60;

/** Pre-generate the EVM networks; anything else renders on demand and is then cached. */
export const getStaticPaths = async () => ({
  paths: EVM_SUPPORTED_CHAINS.map((chain) => ({ params: { network: chain.networkName } })),
  fallback: 'blocking',
});

/**
 * The visible list is client-only, so this fetches the same first page from the same subgraph
 * and renders it as hidden text. See ListingSummary for why it is hidden rather than sr-only.
 */
export const getStaticProps = createSnapshotGetStaticProps({
  fetchSnapshot: async (context) => {
    const network = String(context.params?.network ?? '');
    // Solana listings come from a different source, so subgraph rows would be the wrong list.
    const isEvm = EVM_SUPPORTED_CHAINS.some((chain) => chain.networkName === network);
    if (!isEvm) return [];
    return fetchAgentBlueprints();
  },
  emptyValue: [],
  timeoutMs: ISR_TIMEOUT_MS,
  revalidateSeconds: REVALIDATE_SECONDS,
  revalidateOnErrorSeconds: REVALIDATE_ON_ERROR_SECONDS,
  label: 'marketplace/agent-blueprints',
  toProps: ({ data, generatedAt }) => ({
    initialUnits: data,
    snapshotGeneratedAt: generatedAt,
  }),
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
