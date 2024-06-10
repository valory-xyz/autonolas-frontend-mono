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
  },
});

export const { setStakingContracts, setUserVotes, setLastUserVote, clearState } =
  governSlice.actions;
export const governReducer = governSlice.reducer;
