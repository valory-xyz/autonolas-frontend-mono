import { GraphQLClient } from 'graphql-request';

const requestConfig = {
  jsonSerializer: {
    parse: JSON.parse,
    stringify: JSON.stringify,
  },
};

export const AUTONOLAS_GRAPH_CLIENTS = {
  1: new GraphQLClient(
    process.env.NEXT_PUBLIC_GRAPH_ENDPOINT_MAINNET,
    requestConfig,
  ),
};

// https://docs.balancer.fi/reference/subgraph/ for future subgraph endpoints
export const BALANCER_GRAPH_CLIENTS = {
  1: new GraphQLClient(
    'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-v2',
    requestConfig,
  ),
  5: new GraphQLClient(
    'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-goerli-v2',
    requestConfig,
  ),
  10: new GraphQLClient(
    'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-optimism-v2',
    requestConfig,
  ),
  100: new GraphQLClient(
    'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-gnosis-chain-v2',
    requestConfig,
  ),
  137: new GraphQLClient(
    'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-polygon-v2',
    requestConfig,
  ),
  8453: new GraphQLClient(
    'https://api.studio.thegraph.com/query/24660/balancer-base-v2/version/latest',
    requestConfig,
  ),
  42161: new GraphQLClient(
    'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-arbitrum-v2',
    requestConfig,
  ),
};
