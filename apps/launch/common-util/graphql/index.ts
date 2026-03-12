import { GraphQLClient } from 'graphql-request';
import { base, gnosis, mode, optimism, polygon } from 'viem/chains';
import type { RequestConfig } from 'graphql-request/build/esm/types';

const requestConfig: RequestConfig = {
  method: 'POST',
  jsonSerializer: {
    parse: JSON.parse,
    stringify: JSON.stringify,
  },
};

export const STAKING_GRAPH_CLIENTS = {
  [mode.id]: new GraphQLClient(
    process.env.NEXT_PUBLIC_STAKING_CONTRACTS_MODE_SUBGRAPH_URL!,
    requestConfig,
  ),
  [optimism.id]: new GraphQLClient(
    process.env.NEXT_PUBLIC_STAKING_CONTRACTS_OPTIMISM_SUBGRAPH_URL!,
    requestConfig,
  ),
  [gnosis.id]: new GraphQLClient(
    process.env.NEXT_PUBLIC_STAKING_CONTRACTS_GNOSIS_SUBGRAPH_URL!,
    requestConfig,
  ),
  [base.id]: new GraphQLClient(
    process.env.NEXT_PUBLIC_STAKING_CONTRACTS_BASE_SUBGRAPH_URL!,
    requestConfig,
  ),
  [polygon.id]: new GraphQLClient(
    process.env.NEXT_PUBLIC_STAKING_CONTRACTS_POLYGON_SUBGRAPH_URL!,
    requestConfig,
  ),
} as const;
