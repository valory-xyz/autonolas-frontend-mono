import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SetupState {
  account: `0x${string}` | undefined,
  balance: string | undefined,
  errorMessage: string | undefined,
  chainId: number | undefined,
}


const initialState: SetupState = {
  account: undefined,
  balance: undefined,
  errorMessage: undefined,
  chainId: undefined,
};

export const setupSlice = createSlice({
  name: 'setup',
  initialState,
  reducers: {
    setUserAccount: (state, action: PayloadAction<SetupState['account']>) => {
      state.account = action.payload;
    },
    setUserBalance: (state, action: PayloadAction<SetupState['balance']>) => {
      state.balance = action.payload;
    },
    setChainId: (state, action: PayloadAction<SetupState['chainId']>) => {
      state.chainId = action.payload;
    },
    setErrorMessage: (state, action: PayloadAction<SetupState['errorMessage']>) => {
      state.errorMessage = action.payload;
    },
    setLogout: (state) => {
      state = initialState;
    },
  },
});

export const {
  setUserAccount,
  setUserBalance,
  setChainId,
  setErrorMessage,
  setLogout,
} = setupSlice.actions;
export const setupReducer = setupSlice.reducer; 
