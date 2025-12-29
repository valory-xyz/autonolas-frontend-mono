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
  100: new GraphQLClient(process.env.NEXT_PUBLIC_GNOSIS_MARKETPLACE_SUBGRAPH!, requestConfig),
  8453: new GraphQLClient(process.env.NEXT_PUBLIC_BASE_MARKETPLACE_SUBGRAPH!, requestConfig),
};
