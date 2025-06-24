import { syncTypes } from './_types';

export const setUserAccount = (account) => ({
  type: syncTypes.SET_ACCOUNT,
  data: { account },
});

export const setUserBalance = (balance) => ({
  type: syncTypes.SET_BALANCE,
  data: { balance },
});

export const setChainId = (chainId) => ({
  type: syncTypes.SET_CHAIN_ID,
  data: { chainId },
});

export const setErrorMessage = (errorMessage) => ({
  type: syncTypes.SET_LOGIN_ERROR,
  data: { errorMessage },
});

export const setLogout = () => ({
  type: syncTypes.SET_LOGOUT,
  data: {},
});
