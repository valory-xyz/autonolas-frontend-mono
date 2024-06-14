import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  account: null,
  balance: null,
  errorMessage: null,
  chainId: null,
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
      state.chainId = action.payload;
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
