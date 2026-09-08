import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

import { createSnapshotGetStaticProps } from 'libs/util-ssr/src';

import { Meta } from '../../../components/Meta';
import { getNetworkDisplayName } from '../../../common-util/functions';
import { fetchServices } from '../../../common-util/functions/fetchListings';
import { EVM_SUPPORTED_CHAINS } from '../../../common-util/Login/config';
import { ListingSummary } from '../../../components/ListingSummary';

const ListServices = dynamic(() => import('../../../components/ListServices'), {
  ssr: false,
});

const ISR_TIMEOUT_MS = 20_000;
const REVALIDATE_SECONDS = 300;
const REVALIDATE_ON_ERROR_SECONDS = 60;

/** Pre-generate the EVM networks; anything else, including Solana, renders on demand. */
export const getStaticPaths = async () => ({
  paths: EVM_SUPPORTED_CHAINS.map((chain) => ({ params: { network: chain.networkName } })),
  fallback: 'blocking',
});

/** The visible list is client-only, so fetch its first page here and serve it as hidden text. */
export const getStaticProps = createSnapshotGetStaticProps({
  fetchSnapshot: async (context) => {
    const network = String(context.params?.network ?? '');
    // Solana listings come from the SVM hooks, not the subgraph.
    const isEvm = EVM_SUPPORTED_CHAINS.some((chain) => chain.networkName === network);
    if (!isEvm) return [];
    return fetchServices();
  },
  emptyValue: [],
  timeoutMs: ISR_TIMEOUT_MS,
  revalidateSeconds: REVALIDATE_SECONDS,
  revalidateOnErrorSeconds: REVALIDATE_ON_ERROR_SECONDS,
  label: 'marketplace/ai-agents',
  toProps: ({ data, generatedAt }) => ({
    initialUnits: data,
    snapshotGeneratedAt: generatedAt,
  }),
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
        networkName={networkName}
        snapshotGeneratedAt={snapshotGeneratedAt}
      />
      <ListServices />
    </>
  );
};

export default AIAgents;
