import { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

export type UserVote = {
  slope: number;
  power: number;
  end: number;
};

export type UserVotes = { current: UserVote; next: UserVote };

type Metadata = {
  name: string;
  description: string;
};

type Weight = { percentage: number; value: number };

export type StakingContract = {
  address: `0x${string}`;
  chainId: number;
  metadata: Metadata;
  currentWeight: Weight;
  nextWeight: Weight;
};

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
    clearStakingContracts: (state) => {
      state.stakingContracts = initialState.stakingContracts;
      state.isStakingContractsLoading = true;
    },
    setUserVotes: (state, action: PayloadAction<GovernState['userVotes']>) => {
      state.userVotes = action.payload;
      state.isUserVotesLoading = false;
    },
    clearUserVotes: (state) => {
      state.userVotes = initialState.userVotes;
      state.isUserVotesLoading = false;
    },
    setLastUserVote: (state, action: PayloadAction<GovernState['lastUserVote']>) => {
      state.lastUserVote = action.payload;
    },
    clearLastUserVote: (state) => {
      state.lastUserVote = initialState.lastUserVote;
    },
  },
});

export const {
  setStakingContracts,
  clearStakingContracts,
  setUserVotes,
  clearUserVotes,
  setLastUserVote,
  clearLastUserVote,
} = governSlice.actions;
export const governReducer = governSlice.reducer;
