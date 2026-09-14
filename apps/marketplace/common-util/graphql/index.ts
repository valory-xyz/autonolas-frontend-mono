import { GraphQLClient } from 'graphql-request';
import type { RequestConfig } from 'graphql-request/build/esm/types';

const requestConfig: RequestConfig = {
  method: 'POST',
  jsonSerializer: {
    parse: JSON.parse,
    stringify: JSON.stringify,
  },
};

/**
 * The Olas on-chain registry subgraph, backing the AI agents / components / agent blueprints
 * listings. Lives here rather than in `hooks/useSubgraph` because it is not a hook and is used
 * from `getStaticProps` as well as the client.
 */
export const REGISTRY_GRAPHQL_CLIENT = new GraphQLClient(
  process.env.NEXT_PUBLIC_AUTONOLAS_SUB_GRAPH_URL as string,
  requestConfig,
);

export const MARKETPLACE_SUBGRAPH_CLIENTS = {
  1: new GraphQLClient(process.env.NEXT_PUBLIC_ETHEREUM_MARKETPLACE_SUBGRAPH_URL!, requestConfig),
  10: new GraphQLClient(process.env.NEXT_PUBLIC_OPTIMISM_MARKETPLACE_SUBGRAPH_URL!, requestConfig),
  100: new GraphQLClient(process.env.NEXT_PUBLIC_GNOSIS_MARKETPLACE_SUBGRAPH_URL!, requestConfig),
  137: new GraphQLClient(process.env.NEXT_PUBLIC_POLYGON_MARKETPLACE_SUBGRAPH_URL!, requestConfig),
  8453: new GraphQLClient(process.env.NEXT_PUBLIC_BASE_MARKETPLACE_SUBGRAPH_URL!, requestConfig),
  42161: new GraphQLClient(
    process.env.NEXT_PUBLIC_ARBITRUM_MARKETPLACE_SUBGRAPH_URL!,
    requestConfig,
  ),
  // 42220: new GraphQLClient(process.env.NEXT_PUBLIC_CELO_MARKETPLACE_SUBGRAPH_URL!, requestConfig),
  // TODO(robinhood): add 4663 once the Robinhood marketplace subgraph/squid is deployed
  // (NEXT_PUBLIC_ROBINHOOD_MARKETPLACE_SUBGRAPH_URL), and add 4663 to
  // MARKETPLACE_SUPPORTED_CHAIN_IDS in util/constants.ts so listings pick up request/delivery counts.
} as const;

export type MarketplaceSubgraphChainId = keyof typeof MARKETPLACE_SUBGRAPH_CLIENTS;

export const REGISTRY_SUBGRAPH_CLIENTS = {
  1: new GraphQLClient(process.env.NEXT_PUBLIC_ETHEREUM_REGISTRY_SUBGRAPH!, requestConfig),
  10: new GraphQLClient(process.env.NEXT_PUBLIC_OPTIMISM_REGISTRY_SUBGRAPH!, requestConfig),
  100: new GraphQLClient(process.env.NEXT_PUBLIC_GNOSIS_REGISTRY_SUBGRAPH!, requestConfig),
  137: new GraphQLClient(process.env.NEXT_PUBLIC_POLYGON_REGISTRY_SUBGRAPH!, requestConfig),
  8453: new GraphQLClient(process.env.NEXT_PUBLIC_BASE_REGISTRY_SUBGRAPH!, requestConfig),
  34443: new GraphQLClient(process.env.NEXT_PUBLIC_MODE_REGISTRY_SUBGRAPH!, requestConfig),
  42161: new GraphQLClient(process.env.NEXT_PUBLIC_ARBITRUM_REGISTRY_SUBGRAPH!, requestConfig),
  42220: new GraphQLClient(process.env.NEXT_PUBLIC_CELO_REGISTRY_SUBGRAPH!, requestConfig),
  // TODO(robinhood): add 4663 once the Robinhood registry subgraph/squid is deployed
  // (NEXT_PUBLIC_ROBINHOOD_REGISTRY_SUBGRAPH). Until then the 4663 listings are built from
  // contract reads only. ERC-8004 registries are deployed on 4663 (identity 0x8004A169…), so
  // also add 4663 to ERC8004_SUPPORTED_CHAINS and ERC8004_CHAIN_MAPPING ('robinhood-chain').
} as const;

export const ERC8004_SUPPORTED_CHAINS = [1, 10, 100, 137, 8453, 42161, 42220] as const;
