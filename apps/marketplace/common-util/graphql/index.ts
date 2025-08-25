import { GraphQLClient } from 'graphql-request';
import type { RequestConfig } from 'graphql-request/build/esm/types';

const requestConfig: RequestConfig = {
  method: 'POST',
  jsonSerializer: {
    parse: JSON.parse,
    stringify: JSON.stringify,
  },
};

export const LEGACY_MECH_SUBGRAPH_CLIENT = new GraphQLClient(
  process.env.NEXT_PUBLIC_LEGACY_MECH_SUBGRAPH!,
  requestConfig,
);

export const MM_GRAPHQL_CLIENTS = {
  100: new GraphQLClient(process.env.NEXT_PUBLIC_GNOSIS_MM_SUBGRAPH!, requestConfig),
  8453: new GraphQLClient(process.env.NEXT_PUBLIC_BASE_MM_SUBGRAPH!, requestConfig),
};
