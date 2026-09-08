import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

import { createSnapshotGetStaticProps } from 'libs/util-ssr/src';

import { Meta } from '../../../components/Meta';
import { fetchComponents } from '../../../common-util/functions/fetchListings';
import { EVM_SUPPORTED_CHAINS } from '../../../common-util/Login/config';
import { ListingSummary } from '../../../components/ListingSummary';

const ListComponents = dynamic(() => import('../../../components/ListComponents'), {
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
    return fetchComponents();
  },
  emptyValue: [],
  timeoutMs: ISR_TIMEOUT_MS,
  revalidateSeconds: REVALIDATE_SECONDS,
  revalidateOnErrorSeconds: REVALIDATE_ON_ERROR_SECONDS,
  label: 'marketplace/components',
  toProps: ({ data, generatedAt }) => ({
    initialUnits: data,
    snapshotGeneratedAt: generatedAt,
  }),
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
