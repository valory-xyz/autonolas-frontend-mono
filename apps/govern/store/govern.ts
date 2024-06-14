import { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import { StakingContract, UserVotes } from 'types/index';

interface GovernState {
  stakingContracts: StakingContract[];
  isStakingContractsLoading: boolean;
  userVotes: Record<string, UserVotes>;
  isUserVotesLoading: boolean;
  lastUserVote: number | null;
}

const initialState: GovernState = {
  stakingContracts: [],
  isStakingContractsLoading: true,
  userVotes: {},
  isUserVotesLoading: true,
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
    clearState: (state) => {
      state.stakingContracts = initialState.stakingContracts;
      state.isStakingContractsLoading = true;
      state.userVotes = initialState.userVotes;
      state.isUserVotesLoading = true;
      state.lastUserVote = initialState.lastUserVote;
    },
    clearUserState: (state) => {
      state.userVotes = initialState.userVotes;
      state.isUserVotesLoading = true;
      state.lastUserVote = initialState.lastUserVote;
    },
  },
});

export const { setStakingContracts, setUserVotes, setLastUserVote, clearState, clearUserState } =
  governSlice.actions;
export const governReducer = governSlice.reducer;
