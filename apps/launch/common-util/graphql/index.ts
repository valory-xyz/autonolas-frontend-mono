import { GraphQLClient } from 'graphql-request';
import { arbitrum, base, celo, gnosis, mainnet, mode, optimism, polygon } from 'viem/chains';
import type { RequestConfig } from 'graphql-request/build/esm/types';

const requestConfig: RequestConfig = {
  method: 'POST',
  jsonSerializer: {
    parse: JSON.parse,
    stringify: JSON.stringify,
  },
};

export const STAKING_GRAPH_CLIENTS = {
  [mode.id]: new GraphQLClient(process.env.NEXT_PUBLIC_MODE_STAKING_SUBGRAPH_URL!, requestConfig),
  [optimism.id]: new GraphQLClient(
    process.env.NEXT_PUBLIC_OPTIMISM_STAKING_SUBGRAPH_URL!,
    requestConfig,
  ),
  [gnosis.id]: new GraphQLClient(
    process.env.NEXT_PUBLIC_GNOSIS_STAKING_SUBGRAPH_URL!,
    requestConfig,
  ),
  [base.id]: new GraphQLClient(process.env.NEXT_PUBLIC_BASE_STAKING_SUBGRAPH_URL!, requestConfig),
  [polygon.id]: new GraphQLClient(
    process.env.NEXT_PUBLIC_POLYGON_STAKING_SUBGRAPH_URL!,
    requestConfig,
  ),
  [mainnet.id]: new GraphQLClient(
    process.env.NEXT_PUBLIC_ETHEREUM_STAKING_SUBGRAPH_URL!,
    requestConfig,
  ),
  [arbitrum.id]: new GraphQLClient(
    process.env.NEXT_PUBLIC_ARBITRUM_STAKING_SUBGRAPH_URL!,
    requestConfig,
  ),
  [celo.id]: new GraphQLClient(process.env.NEXT_PUBLIC_CELO_STAKING_SUBGRAPH_URL!, requestConfig),
} as const;
