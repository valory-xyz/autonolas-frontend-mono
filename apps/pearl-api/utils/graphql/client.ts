import { GraphQLClient } from 'graphql-request';

import {
  DEFAULT_PREDICT_OMEN_URL,
  OMEN_THUMBNAIL_MAPPING_SUBGRAPH_ID,
} from '../../constants/achievement';

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

  predictPolymarketClient = new GraphQLClient(url);
  return predictPolymarketClient;
};

export const getPredictOmenClient = (): GraphQLClient => {
  if (!predictOmenClient) {
    predictOmenClient = new GraphQLClient(process.env.PREDICT_OMEN_URL || DEFAULT_PREDICT_OMEN_URL);
  }
  return predictOmenClient;
};

/** Returns null when `THEGRAPH_API_KEY` is unset: thumbnails are optional. */
export const getOmenThumbnailClient = (): GraphQLClient | null => {
  const apiKey = process.env.THEGRAPH_API_KEY;
  if (!apiKey) return null;

  return new GraphQLClient(
    `https://gateway-arbitrum.network.thegraph.com/api/${apiKey}/subgraphs/id/${OMEN_THUMBNAIL_MAPPING_SUBGRAPH_ID}`,
  );
};
