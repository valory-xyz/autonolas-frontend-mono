import { createSnapshotGetStaticProps } from 'libs/util-ssr/src';

import { EVM_SUPPORTED_CHAINS } from 'common-util/Login/config';
import { getChainIdFromPath } from 'common-util/functions';
import type { ListedUnit } from 'common-util/functions/fetchListings';

/** Budget for one subgraph page. */
const ISR_TIMEOUT_MS = 20_000;

/**
 * Pre-generate the EVM networks. Anything else — including Solana — renders on demand and is
 * then cached, so an unrecognised slug behaves as it did before rather than 404ing.
 */
export const listingStaticPaths = async () => ({
  paths: EVM_SUPPORTED_CHAINS.map((chain) => ({ params: { network: chain.networkName } })),
  fallback: 'blocking' as const,
});

/**
 * The three listing pages differ only in which fetcher they call, so the ISR wiring lives here.
 *
 * Each visible list is client-only, so the same first page is fetched here and rendered as
 * hidden text — a crawler gets the listing, the interactive table is untouched.
 */
export const createListingStaticProps = ({
  fetchSnapshot,
  label,
}: {
  fetchSnapshot: () => Promise<ListedUnit[]>;
  label: string;
}) =>
  createSnapshotGetStaticProps<
    ListedUnit[],
    { initialUnits: ListedUnit[]; snapshotGeneratedAt: string | null }
  >({
    fetchSnapshot: async (context) => {
      // Solana listings come from a different source (the SVM hooks), so subgraph rows would be
      // the wrong list. `getChainIdFromPath` returns undefined for it, and unlike a direct
      // comparison it matches slugs case-insensitively, as the route validation does.
      if (!getChainIdFromPath(context.params?.network)) return [];
      return fetchSnapshot();
    },
    emptyValue: [],
    timeoutMs: ISR_TIMEOUT_MS,
    label,
    toProps: ({ data, generatedAt }) => ({
      initialUnits: data,
      snapshotGeneratedAt: generatedAt,
    }),
  });
