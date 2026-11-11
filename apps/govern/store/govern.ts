import { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { Address, Hex } from 'viem';
import { StakingContract, UserVotes } from 'types';

import { Proposal } from 'common-util/graphql/types';

/**
 * A staking incentives claim in flight, per account, so a reopened claim modal cannot send a
 * second one: being quoted and simulated (`preparing`), waiting for the wallet to sign
 * (`sending`), sent and awaited (`waiting`), or sent with no receipt after the wait ended
 * (`unconfirmed`). `run` identifies the claim that set the entry, so a dismissed claim never
 * overwrites a newer one's.
 */
export type PendingClaim = { run: number } & (
  | { status: 'preparing' }
  | { status: 'sending' }
  | { status: 'waiting'; hash: Hex }
  | { status: 'unconfirmed'; hash: Hex }
);

interface GovernState {
  isStakingContractsLoading: boolean;
  stakingContracts: StakingContract[];
  isUserVotesLoading: boolean;
  userVotes: Record<string, UserVotes>;
  proposalVotes: Record<string, Proposal['voteCasts'][0]>;
  /** The timestamp of the last user vote */
  lastUserVote: number | null;
  pendingClaims: Partial<Record<Address, PendingClaim>>;
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
    setPendingClaim: (
      state,
      action: PayloadAction<{ account: Address; pending: PendingClaim | null }>,
    ) => {
      const { account, pending } = action.payload;
      if (pending) state.pendingClaims[account] = pending;
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
