import { apiTypes, syncTypes } from './_types';

/**
 * initialState of the store
 */
const initialState = {
  account: null,
  balance: null,
  chainId: null,
  errorMessage: null,
};

const setup = (state = initialState, { data, type } = {}) => {
  switch (type) {
    case apiTypes.GET_API: {
      return { ...state, data };
    }

    case syncTypes.SET_ACCOUNT:
    case syncTypes.SET_BALANCE:
    case syncTypes.SET_LOGIN_ERROR:
    case syncTypes.SET_CHAIN_ID: {
      return { ...state, ...data };
    }

    case syncTypes.SET_LOGOUT: {
      return { ...initialState };
    }
    default:
      return state;
  }
};

export default setup;
