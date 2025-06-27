import { apiTypes, syncTypes } from './_types';

export type SetupState = {
  account?: string | null;
  balance?: string | null;
  chainId?: number | null;
  errorMessage?: string | null;
};

type Action = {
  type: string;
  data: SetupState;
};

/**
 * initialState of the store
 */
const initialState = {
  account: null,
  balance: null,
  chainId: null,
  errorMessage: null,
};

const setup = (state = initialState, { data, type }: Action) => {
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
