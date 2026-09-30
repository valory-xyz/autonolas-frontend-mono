import { GraphQLClient } from 'graphql-request';

import { OMEN_THUMBNAIL_MAPPING_SUBGRAPH_ID } from '../../constants/achievement';

const REQUEST_TIMEOUT_MS = 10_000;
const THUMBNAIL_TIMEOUT_MS = 5_000;

// A stalled upstream must fail the request instead of running to the function's maxDuration.
const createClient = (url: string, timeoutMs = REQUEST_TIMEOUT_MS) =>
  new GraphQLClient(url, {
    fetch: (input: RequestInfo | URL, init?: RequestInit) =>
      fetch(input, { ...init, signal: AbortSignal.timeout(timeoutMs) }),
  });

// Clients are built on first use so a missing variable fails only the agent that needs it,
// rather than every route that imports this module.
let predictPolymarketClient: GraphQLClient | null = null;
let predictOmenClient: GraphQLClient | null = null;

export const getPredictPolymarketClient = (): GraphQLClient => {
  if (predictPolymarketClient) return predictPolymarketClient;

  const url = process.env.NEXT_PUBLIC_OLAS_POLYMARKET_AGENTS_SQUID_URL;
  if (!url) {
    throw new Error(
      'Environment variable NEXT_PUBLIC_OLAS_POLYMARKET_AGENTS_SQUID_URL is not set.',
    );
  }

  predictPolymarketClient = createClient(url);
  return predictPolymarketClient;
};

export const getPredictOmenClient = (): GraphQLClient => {
  if (predictOmenClient) return predictOmenClient;

  const url = process.env.NEXT_PUBLIC_OLAS_PREDICT_AGENTS_SUBGRAPH_URL;
  if (!url) {
    throw new Error(
      'Environment variable NEXT_PUBLIC_OLAS_PREDICT_AGENTS_SUBGRAPH_URL is not set.',
    );
  }

  predictOmenClient = createClient(url);
  return predictOmenClient;
};

/** Returns null when `THEGRAPH_API_KEY` is unset: thumbnails are optional. */
export const getOmenThumbnailClient = (): GraphQLClient | null => {
  const apiKey = process.env.THEGRAPH_API_KEY;
  if (!apiKey) return null;

  return createClient(
    `https://gateway-arbitrum.network.thegraph.com/api/${apiKey}/subgraphs/id/${OMEN_THUMBNAIL_MAPPING_SUBGRAPH_ID}`,
    THUMBNAIL_TIMEOUT_MS,
  );
};
