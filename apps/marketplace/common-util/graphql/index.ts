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

export const ERC8004_SUPPORTED_CHAINS = [1, 100, 137, 8453] as const;
