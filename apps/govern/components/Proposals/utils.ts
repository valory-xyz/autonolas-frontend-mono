import { ethers } from 'ethers';
import { Address } from 'viem';

import { areAddressesEqual } from 'libs/util-functions/src';
import { formatWeiNumber } from 'libs/util-functions/src';

import { Proposal } from 'common-util/graphql/types';

export enum VoteSupport {
  Against = 0,
  For = 1,
  Abstain = 2,
}

export const VOTES_SUPPORT: Record<number, string> = {
  [VoteSupport.Against]: 'Against',
  [VoteSupport.For]: 'For',
  [VoteSupport.Abstain]: 'Abstain',
};

export const VOTES_SORTED: VoteSupport[] = [
  VoteSupport.For,
  VoteSupport.Against,
  VoteSupport.Abstain,
];

export const formatWeiToEth = (value: string | null | undefined) =>
  formatWeiNumber({
    value: value == null ? undefined : ethers.formatUnits(value, 18),
    maximumFractionDigits: 3,
  });

/**
 * Returns true if the proposal is ongoing
 * (the current block is between the proposal's start and end block)
 */
export const isOngoing = (proposal: Proposal, currentBlock: bigint | undefined) =>
  currentBlock
    ? currentBlock >= BigInt(proposal.startBlock) && currentBlock <= BigInt(proposal.endBlock)
    : false;

/**
 * Returns true if the proposal has not yet been started
 */
export const hasNotStarted = (proposal: Proposal, currentBlock: bigint | undefined) =>
  currentBlock ? currentBlock < BigInt(proposal.startBlock) : false;

/**
 * Returns user's vote, if they voted for the proposal
 */
export const getUserVote = (proposal: Proposal, address: Address) =>
  proposal.voteCasts.find((vote) => areAddressesEqual(vote.voter, address));

/**
 * Returns true if the quorum is reached
 */
export const isQuorumReached = (proposal: Proposal) => {
  const { votesFor, quorum } = proposal;
  // Quorum can be unavailable (e.g. a not-yet-finalized proposal whose on-chain
  // quorum could not be backfilled). Without it we cannot confirm the quorum was
  // reached, so treat it as not reached rather than crashing on BigInt(null).
  if (quorum == null) return false;

  const votesForBigInt = BigInt(votesFor);
  const quorumBigInt = BigInt(quorum);

  return votesForBigInt >= quorumBigInt;
};
