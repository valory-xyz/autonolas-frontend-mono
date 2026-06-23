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
  // null when the subgraph has no quorum yet (e.g. a proposal that is not
  // finalized) and the on-chain backfill in `useProposals` could not resolve it
  quorum: string | null;
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
