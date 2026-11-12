import { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { Address, Hex } from 'viem';
import { StakingContract, UserVotes } from 'types';

import { Proposal } from 'common-util/graphql/types';
import type { Cursors } from 'common-util/functions/claim-batches';

export type PendingClaimStatus =
  | { status: 'preparing' }
  | { status: 'sending' }
  | { status: 'waiting'; hash: Hex; claimedThrough: Cursors }
  | { status: 'unconfirmed'; hash: Hex; claimedThrough: Cursors };

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
  ownClaimedThrough: Cursors;
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
    /** Merges a confirmed claim's cursors; recording one twice changes nothing. */
    recordOwnClaims: (state, action: PayloadAction<Cursors>) => {
      Object.entries(action.payload).forEach(([address, through]) => {
        const current = state.ownClaimedThrough[address as Address];
        if (through !== undefined && (current === undefined || through > current)) {
          state.ownClaimedThrough[address as Address] = through;
        }
      });
    },
    /** Keeps only the own claims a read lags behind; one it reached, or did not read, is dropped. */
    pruneOwnClaims: (state, action: PayloadAction<Cursors>) => {
      Object.entries(state.ownClaimedThrough).forEach(([address, through]) => {
        const fresh = action.payload[address as Address];
        if (through === undefined || fresh === undefined || fresh >= through) {
          delete state.ownClaimedThrough[address as Address];
        }
      });
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
  recordOwnClaims,
  pruneOwnClaims,
} = governSlice.actions;
export const governReducer = governSlice.reducer;
