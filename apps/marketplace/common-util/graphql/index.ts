import { GraphQLClient } from 'graphql-request';
import type { RequestConfig } from 'graphql-request/build/esm/types';

const requestConfig: RequestConfig = {
  method: 'POST',
  jsonSerializer: {
    parse: JSON.parse,
    stringify: JSON.stringify,
  },
};

export const MARKETPLACE_SUBGRAPH_CLIENTS = {
  10: new GraphQLClient(process.env.NEXT_PUBLIC_OPTIMISM_MARKETPLACE_SUBGRAPH!, requestConfig),
  100: new GraphQLClient(process.env.NEXT_PUBLIC_GNOSIS_MARKETPLACE_SUBGRAPH!, requestConfig),
  137: new GraphQLClient(process.env.NEXT_PUBLIC_POLYGON_MARKETPLACE_SUBGRAPH!, requestConfig),
  8453: new GraphQLClient(process.env.NEXT_PUBLIC_BASE_MARKETPLACE_SUBGRAPH!, requestConfig),
};

/**
 * Mech-fees subgraphs keyed by chain ID.
 * Uses existing Vercel env var names.
 */
export const MECH_FEES_SUBGRAPH_CLIENTS = {
  1: new GraphQLClient(process.env.NEXT_PUBLIC_MECH_FEES_ETHEREUM_SUBGRAPH!, requestConfig),
  10: new GraphQLClient(process.env.NEXT_PUBLIC_MECH_FEES_OPTIMISM_SUBGRAPH!, requestConfig),
  100: new GraphQLClient(process.env.NEXT_PUBLIC_NEW_MECH_FEES_GNOSIS_SUBGRAPH_URL!, requestConfig),
  137: new GraphQLClient(process.env.NEXT_PUBLIC_MECH_FEES_POLYGON_SUBGRAPH!, requestConfig),
  8453: new GraphQLClient(process.env.NEXT_PUBLIC_NEW_MECH_FEES_BASE_SUBGRAPH_URL!, requestConfig),
  42161: new GraphQLClient(process.env.NEXT_PUBLIC_MECH_FEES_ARBITRUM_SUBGRAPH!, requestConfig),
  42220: new GraphQLClient(process.env.NEXT_PUBLIC_MECH_FEES_CELO_SUBGRAPH!, requestConfig),
} as const;

/**
 * Legacy Gnosis mech-fees endpoint kept separately for fallback/migration use.
 */
export const LEGACY_GNOSIS_MECH_FEES_SUBGRAPH_CLIENT = new GraphQLClient(
  process.env.NEXT_PUBLIC_LEGACY_MECH_FEES_GNOSIS_SUBGRAPH_URL!,
  requestConfig,
);

/** Mech activity subgraph (requests/deliveries/services) */
export const MECH_SUBGRAPH_CLIENTS = {
  1: new GraphQLClient(process.env.NEXT_PUBLIC_ETHEREUM_MECH_SUBGRAPH!, requestConfig),
  42161: new GraphQLClient(process.env.NEXT_PUBLIC_ARBITRUM_MECH_SUBGRAPH!, requestConfig),
  42220: new GraphQLClient(process.env.NEXT_PUBLIC_CELO_MECH_SUBGRAPH!, requestConfig),
} as const;

/**
 * Mech-fees subgraph (fee analytics). Used by KPI surfaces or future merges; schema is subgraph-specific.
 */
export const MECH_FEES_SUBGRAPH_CLIENTS = {
  1: new GraphQLClient(process.env.NEXT_PUBLIC_ETHEREUM_MECH_FEES_SUBGRAPH!, requestConfig),
  10: new GraphQLClient(process.env.NEXT_PUBLIC_OPTIMISM_MECH_FEES_SUBGRAPH!, requestConfig),
  137: new GraphQLClient(process.env.NEXT_PUBLIC_POLYGON_MECH_FEES_SUBGRAPH!, requestConfig),
  42161: new GraphQLClient(process.env.NEXT_PUBLIC_ARBITRUM_MECH_FEES_SUBGRAPH!, requestConfig),
  42220: new GraphQLClient(process.env.NEXT_PUBLIC_CELO_MECH_FEES_SUBGRAPH!, requestConfig),
} as const;

export type ActivitySubgraphChainId =
  | keyof typeof MARKETPLACE_SUBGRAPH_CLIENTS
  | keyof typeof MECH_SUBGRAPH_CLIENTS;

export const getActivitySubgraphClient = (chainId: ActivitySubgraphChainId): GraphQLClient => {
  if (Object.prototype.hasOwnProperty.call(MECH_SUBGRAPH_CLIENTS, chainId)) {
    return MECH_SUBGRAPH_CLIENTS[chainId as keyof typeof MECH_SUBGRAPH_CLIENTS];
  }
  return MARKETPLACE_SUBGRAPH_CLIENTS[chainId as keyof typeof MARKETPLACE_SUBGRAPH_CLIENTS];
};

export const REGISTRY_SUBGRAPH_CLIENTS = {
  1: new GraphQLClient(process.env.NEXT_PUBLIC_ETHEREUM_REGISTRY_SUBGRAPH!, requestConfig),
  10: new GraphQLClient(process.env.NEXT_PUBLIC_OPTIMISM_REGISTRY_SUBGRAPH!, requestConfig),
  100: new GraphQLClient(process.env.NEXT_PUBLIC_GNOSIS_REGISTRY_SUBGRAPH!, requestConfig),
  137: new GraphQLClient(process.env.NEXT_PUBLIC_POLYGON_REGISTRY_SUBGRAPH!, requestConfig),
  8453: new GraphQLClient(process.env.NEXT_PUBLIC_BASE_REGISTRY_SUBGRAPH!, requestConfig),
  34443: new GraphQLClient(process.env.NEXT_PUBLIC_MODE_REGISTRY_SUBGRAPH!, requestConfig),
  42161: new GraphQLClient(process.env.NEXT_PUBLIC_ARBITRUM_REGISTRY_SUBGRAPH!, requestConfig),
  42220: new GraphQLClient(process.env.NEXT_PUBLIC_CELO_REGISTRY_SUBGRAPH!, requestConfig),
} as const;

export const ERC8004_SUPPORTED_CHAINS = [1, 10, 100, 137, 8453, 42161, 42220] as const;
