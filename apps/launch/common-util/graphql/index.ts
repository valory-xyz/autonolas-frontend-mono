import { GraphQLClient } from 'graphql-request';
import { arbitrum, base, celo, gnosis, mainnet, mode, optimism, polygon } from 'viem/chains';
import type { RequestConfig } from 'graphql-request/build/esm/types';

import { robinhood } from 'libs/util-constants/src';

const requestConfig: RequestConfig = {
  method: 'POST',
  jsonSerializer: {
    parse: JSON.parse,
    stringify: JSON.stringify,
  },
};

const STAKING_SUBGRAPH_URLS = {
  [mode.id]: process.env.NEXT_PUBLIC_MODE_STAKING_SUBGRAPH_URL,
  [optimism.id]: process.env.NEXT_PUBLIC_OPTIMISM_STAKING_SUBGRAPH_URL,
  [gnosis.id]: process.env.NEXT_PUBLIC_GNOSIS_STAKING_SUBGRAPH_URL,
  [base.id]: process.env.NEXT_PUBLIC_STAKING_BASE_SQUID_URL,
  [polygon.id]: process.env.NEXT_PUBLIC_STAKING_POLYGON_SQUID_URL,
  [mainnet.id]: process.env.NEXT_PUBLIC_ETHEREUM_STAKING_SUBGRAPH_URL,
  [arbitrum.id]: process.env.NEXT_PUBLIC_ARBITRUM_STAKING_SUBGRAPH_URL,
  [celo.id]: process.env.NEXT_PUBLIC_CELO_STAKING_SUBGRAPH_URL,
  [robinhood.id]: process.env.NEXT_PUBLIC_STAKING_ROBINHOOD_SQUID_URL,
} as const;

type StakingSubgraphChain = keyof typeof STAKING_SUBGRAPH_URLS;

/** An unset env var used to reach `GraphQLClient` as `undefined`, so every request on that chain
 *  failed before the log fallback ran. Chains without a configured URL get no client instead,
 *  and `hasSubgraphSupport` reports them as unsupported (same rule as apps/operate). */
const isConfigured = (url: string | undefined): url is string =>
  typeof url === 'string' && /^https?:\/\//.test(url);

export const STAKING_GRAPH_CLIENTS = Object.fromEntries(
  Object.entries(STAKING_SUBGRAPH_URLS).map(([chainId, url]) => [
    Number(chainId),
    isConfigured(url) ? new GraphQLClient(url, requestConfig) : null,
  ]),
) as Record<StakingSubgraphChain, GraphQLClient | null>;
