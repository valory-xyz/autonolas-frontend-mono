import { GraphQLClient } from 'graphql-request';
import {
  arbitrum,
  base,
  gnosis,
  goerli,
  mainnet,
  optimism,
  polygon,
} from 'viem/chains';

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
  [mainnet.id]: new GraphQLClient(
    process.env.NEXT_PUBLIC_MAINNET_BALANCER_URL,
    requestConfig,
  ),
  [goerli.id]: new GraphQLClient(
    'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-goerli-v2',
    requestConfig,
  ),
  [optimism.id]: new GraphQLClient(
    process.env.NEXT_PUBLIC_OPTIMISM_BALANCER_URL,
    requestConfig,
  ),
  [gnosis.id]: new GraphQLClient(
    process.env.NEXT_PUBLIC_GNOSIS_BALANCER_URL,
    requestConfig,
  ),
  [polygon.id]: new GraphQLClient(
    process.env.NEXT_PUBLIC_POLYGON_BALANCER_URL,
    requestConfig,
  ),
  [base.id]: new GraphQLClient(
    'https://api.studio.thegraph.com/query/24660/balancer-base-v2/version/latest',
    requestConfig,
  ),
  [arbitrum.id]: new GraphQLClient(
    process.env.NEXT_PUBLIC_ARBITRUM_BALANCER_URL,
    requestConfig,
  ),
};
