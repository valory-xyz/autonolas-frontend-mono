import { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { Address, Hex } from 'viem';
import { StakingContract, UserVotes } from 'types';

import { Proposal } from 'common-util/graphql/types';

export type PendingClaimStatus =
  | { status: 'preparing' }
  | { status: 'sending' }
  | { status: 'waiting'; hash: Hex }
  | { status: 'unconfirmed'; hash: Hex };

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
}

const initialState: GovernState = {
  isStakingContractsLoading: true,
  stakingContracts: [],
  isUserVotesLoading: true,
  userVotes: {},
  proposalVotes: {},
  lastUserVote: null,
  pendingClaims: {},
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
    // A sent claim can still mine, so its guard outlives a state reset.
    clearState: (state) => ({ ...initialState, pendingClaims: state.pendingClaims }),
    clearUserState: (state) => {
      state.userVotes = initialState.userVotes;
      state.isUserVotesLoading = true;
      state.lastUserVote = initialState.lastUserVote;
    },
    setProposalVotes: (state, action: PayloadAction<GovernState['proposalVotes']>) => {
      state.proposalVotes = { ...state.proposalVotes, ...action.payload };
    },
    /**
     * Writes or clears only the entry of `run`. A run whose entry was dismissed gets one back when
     * it writes again, since only a claim that was signed anyway still writes.
     */
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
} = governSlice.actions;
export const governReducer = governSlice.reducer;
