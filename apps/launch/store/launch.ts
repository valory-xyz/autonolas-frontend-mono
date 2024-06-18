import { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import { MyStakingContract } from 'types/index';

type LaunchState = {
  isMyStakingContractsLoading: boolean;
  /** list of my staking contract */
  myStakingContracts: MyStakingContract[];
};

const dummyMyStakingContracts: MyStakingContract[] = [
  {
    id: '1',
    name: 'Contract #1 Create Prediction Market Modernized',
    description:
      'This is the very long description of the contract that targets governors and explains the value of the contract to them. This is the very long description of the contract that targets governors and explains the value of the contract to them.',
    template: 'Create Prediction Markets',
    isNominated: true,
  },
  {
    id: '2',
    name: 'Contract #2 Create Prediction Market Modernized',
    description:
      'lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    template: 'Create Prediction Markets',
    isNominated: false,
  },
];

const initialState: LaunchState = {
  isMyStakingContractsLoading: false,
  myStakingContracts: dummyMyStakingContracts,
  // myStakingContracts: [],
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
