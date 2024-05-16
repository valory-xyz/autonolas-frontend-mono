import { createAsyncThunk } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import {
  GetNomineesWeightsParams,
  GetUserSlopeParams,
  getAllNominees,
  getNomineesWeights,
  getUserSlopes,
} from 'common-util/functions';

// Fetch all nominees - the contracts that are added for voting
export const fetchAllNominees = createAsyncThunk('govern/fetchAllNominees', async (_, thunkAPI) => {
  try {
    const result = await getAllNominees();
    return result;
  } catch (error) {
    return thunkAPI.rejectWithValue(error);
  }
});

// Fetch nominees aggregated allocation
// return Record<nominee, weights[]>
export const fetchNomineesWeights = createAsyncThunk(
  'govern/fetchNomineesWeights',
  async ({ nominees, time }: GetNomineesWeightsParams, thunkAPI) => {
    try {
      const result = await getNomineesWeights({ nominees, time });
      return result;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  },
);

// Fetch user's allocation
// return Record<nominee, slopes[]>
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

type Nominee = { address: string; chainId: string };
type NomineeWeight = {
  weight: string;
  totalSum: string;
};

type UserSlope = {
  slope: string;
  power: string;
  end: string;
};

export type StakingContract = {
  address: string;
  chainId: string;
  name: string;
  currentWeight: string;
  nextWeight: string;
};

interface GovernState {
  allNominees: Nominee[];
  allNomineesStatus: string;
  nomineesWeights: Record<string, NomineeWeight>;
  nomineesWeightsStatus: string;
  totalSupply: string;
  voteUserPower: string;
  userVotes: Record<string, UserSlope>;
  userVotesStatus: string;
  stakingContracts: StakingContract[];
}

const initialState: GovernState = {
  allNominees: [],
  allNomineesStatus: '',
  nomineesWeights: {},
  nomineesWeightsStatus: '',
  // TODO: request veOlas -> totalSupplyLockedAtT
  totalSupply: '73450587757603665407702400',
  voteUserPower: '0',
  userVotes: {},
  userVotesStatus: '',
  stakingContracts: [],
};

export const governSlice = createSlice({
  name: 'govern',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllNominees.pending, (state) => {
        state.allNomineesStatus = 'Loading';
      })
      .addCase(fetchAllNominees.fulfilled, (state, action) => {
        state.allNomineesStatus = 'Success';

        const result: Nominee[] = action.payload.map((item) => {
          const [address, chainId] = item;
          return {
            address,
            chainId,
          };
        });
        state.allNominees = result;
        state.stakingContracts = result.map((item, index) => ({
          ...item,
          name: names[index] || '',
          currentWeight: '',
          nextWeight: '',
        }));
      })
      .addCase(fetchAllNominees.rejected, (state) => {
        state.allNomineesStatus = 'Error';
      })
      .addCase(fetchNomineesWeights.pending, (state) => {
        state.nomineesWeightsStatus = 'Loading';
      })
      .addCase(fetchNomineesWeights.fulfilled, (state, action) => {
        state.nomineesWeightsStatus = 'Success';
        state.nomineesWeights = action.payload;
        state.stakingContracts = state.stakingContracts.map((item) => ({
          ...item,
          // TODO: come up with better rounding
          currentWeight: action.payload[item.address]
            ? (Number(action.payload[item.address].weight) / 10 ** 16).toFixed(2)
            : '0',
        }));
      })
      .addCase(fetchNomineesWeights.rejected, (state) => {
        state.nomineesWeightsStatus = 'Error';
      })
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

export const governReducer = governSlice.reducer;

const names = [
  'Conduct Market Research',
  'Analyze Market Trends',
  'Develop Smart Contracts',
  'Implement Governance Solutions',
  'Explore Decentralized Finance (DeFi)',
  'Engage in Yield Farming Strategies',
  'Build Decentralized Applications (dApps)',
  'Explore NFT Ecosystem Opportunities',
  'Participate in Community Governance',
  'Experiment with Decentralized Autonomous Organizations (DAOs)',
];
