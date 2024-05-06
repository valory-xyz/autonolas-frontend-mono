import { createSlice } from '@reduxjs/toolkit';

import { EVM_SUPPORTED_CHAINS, } from 'common-util/Login/config';

const initialState = {
  account: null,
  balance: null,
  vmType: null,
  errorMessage: null,

  // chain info
  chainId: null,
  chainDisplayName: null,
  chainName: null,
};

export const setupSlice = createSlice({
  name: 'setup',
  initialState,
  reducers: {
    setUserAccount: (state, action) => {
      state.account = action.payload;
    },
    setUserBalance: (state, action) => {
      state.balance = action.payload;
    },
    setChainId: (state, action) => {
      const chainId = action.payload;
      const networkInfo = EVM_SUPPORTED_CHAINS.find(
        (item) => item.id === chainId,
      );

      state.chainId = chainId;
      state.chainDisplayName = networkInfo?.networkDisplayName || null;
      state.chainName = networkInfo?.networkName || null;
    },
    setErrorMessage: (state, action) => {
      state.errorMessage = action.payload;
    },
    setLogout: (state, _action) => {
      state = initialState;
    },
    setStoreState: (state, action) => {
      state = action.payload;
    },
  },
});

export const {
  setUserAccount,
  setUserBalance,
  setChainId,
  setErrorMessage,
  setLogout,
  setStoreState,
} = setupSlice.actions;
export const setupReducer = setupSlice.reducer; 
