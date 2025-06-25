import { syncTypes } from './_types';

export const setUserAccount = (account: string) => ({
  type: syncTypes.SET_ACCOUNT,
  data: { account },
});

export const setUserBalance = (balance: string) => ({
  type: syncTypes.SET_BALANCE,
  data: { balance },
});

export const setChainId = (chainId: number) => ({
  type: syncTypes.SET_CHAIN_ID,
  data: { chainId },
});

export const setErrorMessage = (errorMessage: string) => ({
  type: syncTypes.SET_LOGIN_ERROR,
  data: { errorMessage },
});

export const setLogout = () => ({
  type: syncTypes.SET_LOGOUT,
  data: {},
});
