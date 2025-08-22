import { GraphQLClient } from 'graphql-request';
import type { RequestConfig } from 'graphql-request/build/esm/types';

export type Request = {
  id: string;
  ipfsHash: string;
  blockTimestamp: string;
  transactionHash: string;
  sender: {
    id: string;
  };
  delivery: {
    ipfsHash: string;
    mech: string;
    transactionHash: string;
    blockTimestamp: string;
  };
};

export type Delivery = {
  id: string;
  ipfsHash: string;
  mech: string;
  sender: string;
  blockTimestamp: string;
  transactionHash: string;
  request: {
    id: string;
    ipfsHash: string;
    blockTimestamp: string;
    transactionHash: string;
  };
};

export type Service = {
  id: string;
  totalRequests: number;
  totalDeliveries: number;
  metadata: {
    metadata: string;
  };
  requests: Request[];
  deliveries: Delivery[];
};

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
  gnosis: new GraphQLClient(process.env.NEXT_PUBLIC_GNOSIS_MM_SUBGRAPH!, requestConfig),
  base: new GraphQLClient(process.env.NEXT_PUBLIC_BASE_MM_SUBGRAPH!, requestConfig),
};

export interface GraphQLResponse<T> {
  services: T[];
}

export type MarketplaceSupportedNetwork = 'gnosis' | 'base';
