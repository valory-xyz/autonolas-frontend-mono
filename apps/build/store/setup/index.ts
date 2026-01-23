import type { AnyAction } from '@reduxjs/toolkit';
import { apiTypes, syncTypes } from './_types';

export type SetupState = {
  account?: string | null;
  balance?: string | null;
  chainId?: number | null;
  errorMessage?: string | null;
};

type CustomAction = {
  type: string;
  data: SetupState;
};

/**
 * initialState of the store
 */
const initialState: SetupState = {
  account: null,
  balance: null,
  chainId: null,
  errorMessage: null,
};

const setup = (state: SetupState = initialState, action: AnyAction): SetupState => {
  // Type guard to check if action has the expected shape
  const customAction = action as CustomAction;
  if (!customAction.data && !customAction.type) {
    return state;
  }

  const { data, type } = customAction;
  switch (type) {
    case apiTypes.GET_API: {
      return { ...state, ...data };
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
