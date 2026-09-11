import { createSnapshotGetStaticProps } from 'libs/util-ssr/src';

import { EVM_SUPPORTED_CHAINS } from 'common-util/Login/config';
import { L1_NETWORK_NAME, getChainIdFromPath, isL1NetworkName } from 'common-util/functions';
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
 * Components and agent blueprints are L1-only (`useHandleRoute` redirects other networks), so
 * pre-rendering all eight networks published seven duplicates. Other networks still render on
 * demand and redirect as before; they just carry no listing.
 */
export const l1ListingStaticPaths = async () => ({
  paths: [{ params: { network: L1_NETWORK_NAME } }],
  fallback: 'blocking' as const,
});

/**
 * Shared ISR wiring for the three listing pages. Each visible list is client-only, so the first
 * page is fetched here and rendered as hidden text for crawlers.
 */
export const createListingStaticProps = ({
  fetchSnapshot,
  label,
  l1Only = false,
}: {
  fetchSnapshot: () => Promise<ListedUnit[]>;
  label: string;
  /** Set for the L1-only listings, so the other networks serve no rows to index. */
  l1Only?: boolean;
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
      if (l1Only && !isL1NetworkName(context.params?.network)) return [];
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
