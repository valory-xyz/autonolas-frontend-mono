import { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { Address, Hex } from 'viem';
import { StakingContract, UserVotes } from 'types';

import { Proposal } from 'common-util/graphql/types';
import type { ClaimBatch } from 'common-util/functions/staking-incentives-claim';

export type PendingClaimStatus =
  | { status: 'preparing' }
  | { status: 'sending' }
  | { status: 'waiting'; hash: Hex; batch: ClaimBatch }
  | { status: 'unconfirmed'; hash: Hex; batch: ClaimBatch };

/**
 * A claim in flight, so a reopened modal cannot send another while one may still mine. `run`
 * identifies the claim that owns the entry.
 */
export type PendingClaim = { run: number } & PendingClaimStatus;

interface GovernState {
  isStakingContractsLoading: boolean;
  stakingContracts: StakingContract[];
  isUserVotesLoading: boolean;
  userVotes: Record<string, UserVotes>;
  proposalVotes: Record<string, Proposal['voteCasts'][0]>;
  /** The timestamp of the last user vote */
  lastUserVote: number | null;
  pendingClaims: Partial<Record<Address, PendingClaim[]>>;
  /** Claim cursors this user's confirmed claims advanced to, kept across modal mounts. */
  ownClaimedThrough: Partial<Record<Address, number>>;
}

const initialState: GovernState = {
  isStakingContractsLoading: true,
  stakingContracts: [],
  isUserVotesLoading: true,
  userVotes: {},
  proposalVotes: {},
  lastUserVote: null,
  pendingClaims: {},
  ownClaimedThrough: {},
};

export const governSlice = createSlice({
  name: 'govern',
  initialState,
  reducers: {
    setStakingContracts: (state, action: PayloadAction<GovernState['stakingContracts']>) => {
      state.stakingContracts = action.payload;
      state.isStakingContractsLoading = false;
    },
    setUserVotes: (state, action: PayloadAction<GovernState['userVotes']>) => {
      state.userVotes = action.payload;
      state.isUserVotesLoading = false;
    },
    setLastUserVote: (state, action: PayloadAction<GovernState['lastUserVote']>) => {
      state.lastUserVote = action.payload;
    },
    // A sent claim can still mine, so its guard and the cursors it moved outlive a state reset.
    clearState: (state) => ({
      ...initialState,
      pendingClaims: state.pendingClaims,
      ownClaimedThrough: state.ownClaimedThrough,
    }),
    clearUserState: (state) => {
      state.userVotes = initialState.userVotes;
      state.isUserVotesLoading = true;
      state.lastUserVote = initialState.lastUserVote;
    },
    setProposalVotes: (state, action: PayloadAction<GovernState['proposalVotes']>) => {
      state.proposalVotes = { ...state.proposalVotes, ...action.payload };
    },
    // A dismissed run gets an entry back when it writes again: only a claim signed anyway does.
    setPendingClaim: (
      state,
      action: PayloadAction<{
        account: Address;
        run: number;
        pending: PendingClaimStatus | null;
      }>,
    ) => {
      const { account, run, pending } = action.payload;
      const entries = state.pendingClaims[account] ?? [];
      const index = entries.findIndex((entry) => entry.run === run);
      if (pending && index === -1) entries.push({ ...pending, run });
      else if (pending) entries[index] = { ...pending, run };
      else if (index !== -1) entries.splice(index, 1);
      if (entries.length > 0) state.pendingClaims[account] = entries;
      else delete state.pendingClaims[account];
    },
    setOwnClaimedThrough: (state, action: PayloadAction<GovernState['ownClaimedThrough']>) => {
      state.ownClaimedThrough = action.payload;
    },
  },
});

export const {
  setStakingContracts,
  setUserVotes,
  setLastUserVote,
  clearState,
  clearUserState,
  setProposalVotes,
  setPendingClaim,
  setOwnClaimedThrough,
} = governSlice.actions;
export const governReducer = governSlice.reducer;
