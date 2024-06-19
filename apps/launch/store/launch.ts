import { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import { MyStakingContract } from 'types/index';

type LaunchState = {
  isMyStakingContractsLoading: boolean;
  /** list of my staking contract */
  myStakingContracts: MyStakingContract[];
};

const initialState: LaunchState = {
  isMyStakingContractsLoading: false,
  myStakingContracts: [],
};

export const launchSlice = createSlice({
  name: 'launch',
  initialState,
  reducers: {
    setStakingContracts: (state, action: PayloadAction<LaunchState['myStakingContracts']>) => {
      state.myStakingContracts = action.payload;
      state.isMyStakingContractsLoading = false;
    },
    clearState: (state) => {},
  },
});

export const { setStakingContracts, clearState } = launchSlice.actions;
export const launchReducer = launchSlice.reducer;
