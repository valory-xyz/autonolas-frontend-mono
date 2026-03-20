import { MECH_FEES_SUBGRAPH_CLIENTS } from './index';
import type { GraphQLClient } from 'graphql-request';

export type MechFeesSubgraphChainId = keyof typeof MECH_FEES_SUBGRAPH_CLIENTS;

export const getMechFeesSubgraphClient = (chainId: number): GraphQLClient | null => {
  if (Object.prototype.hasOwnProperty.call(MECH_FEES_SUBGRAPH_CLIENTS, chainId)) {
    return MECH_FEES_SUBGRAPH_CLIENTS[chainId as MechFeesSubgraphChainId];
  }
  return null;
};
