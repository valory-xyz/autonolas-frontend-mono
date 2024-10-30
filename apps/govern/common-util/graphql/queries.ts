import { gql, request } from 'graphql-request';

import { Proposals } from './types';

const GOVERNOR_SUBGRAPH_URL = process.env.NEXT_PUBLIC_GOVERNOR_SUBGRAPH_URL;

const getProposalsQuery = gql`
  query GetProposalCreateds {
    proposalCreateds(first: 1000, orderBy: blockTimestamp, orderDirection: desc) {
      id
      blockNumber
      blockTimestamp
      proposalId
      startBlock
      endBlock
      isQueued
      isExecuted
      isCancelled
      description
      votesFor
      votesAgainst
      quorum
      proposer
      transactionHash
      voteCasts {
        id
        weight
        support
        voter
      }
    }
  }
`;

export const getProposals = async () =>
  request<Proposals>(GOVERNOR_SUBGRAPH_URL as string, getProposalsQuery);
