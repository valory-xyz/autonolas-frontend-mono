import { createSlice } from '@reduxjs/toolkit';
import { SUPPORTED_CHAINS_MORE_INFO } from 'common-util/Login/config';

const initialState = {
  account: null,
  balance: null,
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
      const data = action.payload;
      const networkInfo = SUPPORTED_CHAINS_MORE_INFO.find(
        (item) => item.id === data.chainId,
      );

      console.log('networkInfo', networkInfo);

      state.chainId = action.payload;
      state.chainDisplayName = networkInfo?.networkDisplayName || null;
      state.chainName = networkInfo?.networkName || null;
    },
    setErrorMessage: (state, action) => {
      state.errorMessage = action.payload;
    },
    setLogout: (state, action) => {
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
