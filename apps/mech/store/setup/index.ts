import { Network } from 'types/index';
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

export type Setup = {
  account?: `0x${string}` | null;
  balance?: string | null;
  chainId?: Network | null;
  errorMessage?: string | null;
};

type Action = {
  data?: Setup;
  type: string;
};

const setup = (state: Setup = initialState, { data, type }: Action) => {
  switch (type) {
    case apiTypes.GET_API: {
      return { ...state, data };
    }

    case syncTypes.SET_ACCOUNT:
    case syncTypes.SET_BALANCE:
    case syncTypes.SET_LOGIN_ERROR:
    case syncTypes.SET_CHAIND_ID:
    case syncTypes.SET_STORE_STATE: {
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
