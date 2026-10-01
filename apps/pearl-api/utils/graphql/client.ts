import { GraphQLClient } from 'graphql-request';

const REQUEST_TIMEOUT_MS = 10_000;

// A stalled upstream must fail the request instead of running to the function's maxDuration.
const createClient = (url: string) =>
  new GraphQLClient(url, {
    fetch: (input: RequestInfo | URL, init?: RequestInit) =>
      fetch(input, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }),
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
