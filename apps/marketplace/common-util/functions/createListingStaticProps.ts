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
 * Components and agent blueprints are registered on Ethereum L1 only — `useHandleRoute`
 * redirects every other network on those routes to `/[network]/ai-agents`. Pre-rendering them
 * for all eight networks published seven crawlable copies of the same list at URLs a reader is
 * immediately bounced away from, so they pre-render Ethereum alone.
 *
 * `fallback` stays `'blocking'`: a direct hit on `/base/components` still renders and then
 * redirects on the client, exactly as before. It just carries no listing to index.
 */
const L1_NETWORK = 'ethereum';

const isL1Network = (network?: string | string[]) =>
  typeof network === 'string' && network.toLowerCase() === L1_NETWORK;

export const l1ListingStaticPaths = async () => ({
  paths: [{ params: { network: L1_NETWORK } }],
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
      if (l1Only && !isL1Network(context.params?.network)) return [];
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
