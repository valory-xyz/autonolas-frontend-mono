import { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { Address } from 'viem';

import { MyStakingContract } from 'types/index';

type LaunchState = {
  isMyStakingContractsLoading: boolean;
  /** list of my staking contract */
  myStakingContracts: MyStakingContract[];
};

const initialState: LaunchState = {
  isMyStakingContractsLoading: true,
  myStakingContracts: [],
};

export const launchSlice = createSlice({
  name: 'launch',
  initialState,
  reducers: {
    setMyStakingContracts: (state, action: PayloadAction<LaunchState['myStakingContracts']>) => {
      state.myStakingContracts = action.payload;
      state.isMyStakingContractsLoading = false;
    },
    setIsNominated: (state, action: PayloadAction<{ id: Address }>) => {
      const newContracts = state.myStakingContracts.map((item) => {
        return item.id === action.payload.id ? { ...item, isNominated: true } : item;
      });
      state.myStakingContracts = newContracts;
    },
    clearState: (state) => {},
  },
});

export const { setMyStakingContracts, setIsNominated, clearState } = launchSlice.actions;
export const launchReducer = launchSlice.reducer;
