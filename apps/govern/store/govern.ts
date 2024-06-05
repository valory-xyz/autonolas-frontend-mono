import { PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import {
  GetUserSlopeParams,
  getUserSlopes,
} from 'common-util/functions';

export const fetchUserVotes = createAsyncThunk(
  'govern/fetchUserVotes',
  async ({ account, nominees }: GetUserSlopeParams, thunkAPI) => {
    try {
      const result = await getUserSlopes({ account, nominees });
      return result;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  },
);

type UserSlope = {
  slope: string;
  power: string;
  end: string;
};

type Metadata = {
  name: string;
  description: string;
}

type Weight = { percentage: number; value: number };

export type StakingContract = {
  address: string;
  chainId: number;
  metadata: Metadata;
  currentWeight: Weight;
  nextWeight: Weight;
};

interface GovernState {
  voteUserPower: string;
  userVotes: Record<string, UserSlope>;
  userVotesStatus: string;
  stakingContracts: StakingContract[];
  isStakingContractsLoading: boolean;
}

const initialState: GovernState = {
  voteUserPower: '0',
  userVotes: {},
  userVotesStatus: '',
  stakingContracts: [],
  isStakingContractsLoading: true,
};

export const governSlice = createSlice({
  name: 'govern',
  initialState,
  reducers: {
    setStakingContracts: (state, action: PayloadAction<GovernState['stakingContracts']>) => {
      state.stakingContracts = action.payload;
      state.isStakingContractsLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserVotes.pending, (state) => {
        state.userVotesStatus = 'Loading';
      })
      .addCase(fetchUserVotes.fulfilled, (state, action) => {
        state.userVotesStatus = 'Success';
        state.userVotes = action.payload;
      })
      .addCase(fetchUserVotes.rejected, (state) => {
        state.userVotesStatus = 'Error';
      });
  },
});

export const {
  setStakingContracts,
} = governSlice.actions;
export const governReducer = governSlice.reducer;
