import { Address } from 'viem';

export type Proposal = {
  id: string;
  proposer: Address;
  blockNumber: string;
  blockTimestamp: string;
  proposalId: string;
  startBlock: string;
  endBlock: string;
  isQueued: boolean;
  isExecuted: boolean;
  isCancelled: boolean;
  description: string;
  votesFor: string;
  votesAgainst: string;
  quorum: string;
  transactionHash: string;
  voteCasts: {
    id: string;
    weight: string;
    support: number;
    voter: Address;
  }[];
};

export type Proposals = {
  proposalCreateds: Proposal[];
};
