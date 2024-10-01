import { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { StakingContract, UserVotes } from 'types';

import { Proposal } from 'common-util/graphql/types';

interface GovernState {
  isStakingContractsLoading: boolean;
  stakingContracts: StakingContract[];
  isUserVotesLoading: boolean;
  userVotes: Record<string, UserVotes>;
  proposalVotes: Record<string, Proposal['voteCasts'][0]>;
  /** The timestamp of the last user vote */
  lastUserVote: number | null;
}

const initialState: GovernState = {
  isStakingContractsLoading: true,
  stakingContracts: [],
  isUserVotesLoading: true,
  userVotes: {},
  proposalVotes: {},
  lastUserVote: null,
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
    clearState: () => initialState,
    clearUserState: (state) => {
      state.userVotes = initialState.userVotes;
      state.isUserVotesLoading = true;
      state.lastUserVote = initialState.lastUserVote;
    },
    setProposalVotes: (state, action: PayloadAction<GovernState['proposalVotes']>) => {
      state.proposalVotes = { ...state.proposalVotes, ...action.payload };
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
} = governSlice.actions;
export const governReducer = governSlice.reducer;
