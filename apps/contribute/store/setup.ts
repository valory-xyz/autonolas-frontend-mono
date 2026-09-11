import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useSelector } from 'react-redux';

import { rankLeaderboardUsers } from 'common-util/api/leaderboard';
import { ContributeAgent } from 'types/users';

import { store } from '.';
import { LeaderboardUser, ModuleDetails, Tweet } from './types';

type SetupState = {
  account: string | null;
  balance: number | string | null;
  chainId: number | null;
  errorMessage: string | null;
  /** If the user is verified. */
  isVerified: boolean;
  // leaderboard
  isLeaderboardLoading: boolean;
  leaderboard: LeaderboardUser[];
  // tweets
  isTweetsLoading: boolean;
  tweets: Tweet[];
  // module details
  isModuleDetailsLoading: boolean;
  moduleDetails: ModuleDetails | null;
  moduleDetailsAttributeId: number | null;

  // TODO: below to be removed
  nftDetails: { tokenId: string } | null;
};

const initialState: SetupState = {
  account: null,
  balance: null,
  chainId: null,
  errorMessage: null,
  /**
   * initially set to true to avoid glitch
   * (util the API is completed)
   */
  isVerified: true,

  // leaderboard
  isLeaderboardLoading: false,
  leaderboard: [],

  // tweets
  isTweetsLoading: false,
  tweets: [],

  // module details
  isModuleDetailsLoading: false,
  moduleDetails: null,
  moduleDetailsAttributeId: null,

  // nft details
  nftDetails: null,
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
    setIsVerified: (state, action: PayloadAction<SetupState['isVerified']>) => {
      state.isVerified = action.payload;
    },
    setIsLeaderboardLoading: (state, action: PayloadAction<SetupState['isLeaderboardLoading']>) => {
      state.isLeaderboardLoading = action.payload;
    },
    setLeaderboard: (state, action: PayloadAction<LeaderboardUser[]>) => {
      const leaderboard = action.payload;
      const rankedUsers = rankLeaderboardUsers(leaderboard);
      state.leaderboard = rankedUsers;
    },
    updateLeaderboardUser: (state, action: PayloadAction<ContributeAgent>) => {
      const leaderboard = state.leaderboard.map((user) => {
        if (user.attribute_id === action.payload.attribute_id) {
          return {
            ...action.payload.json_value,
            attribute_id: action.payload.attribute_id,
            rank: null,
          };
        }
        return user;
      });

      const rankedUsers = rankLeaderboardUsers(leaderboard);
      state.leaderboard = rankedUsers;
    },
    setIsTweetsLoading: (state, action: PayloadAction<SetupState['isTweetsLoading']>) => {
      state.isTweetsLoading = action.payload;
    },
    setTweets: (state, action: PayloadAction<SetupState['tweets']>) => {
      state.tweets = action.payload;
    },
    setIsModuleDetailsLoading: (
      state,
      action: PayloadAction<SetupState['isModuleDetailsLoading']>,
    ) => {
      state.isModuleDetailsLoading = action.payload;
    },
    setModuleDetails: (state, action: PayloadAction<SetupState['moduleDetails']>) => {
      state.moduleDetails = action.payload;
    },
    setModuleDetailsAttributeId: (
      state,
      action: PayloadAction<SetupState['moduleDetailsAttributeId']>,
    ) => {
      state.moduleDetailsAttributeId = action.payload;
    },
    setNftDetails: (state, action: PayloadAction<SetupState['nftDetails']>) => {
      state.nftDetails = action.payload;
    },
    setLogout: (state) => {
      state.account = null;
      state.balance = null;
      state.errorMessage = null;
      state.isVerified = false;
    },
  },
});

export const {
  setUserAccount,
  setUserBalance,
  setChainId,
  setErrorMessage,
  setIsVerified,
  setIsLeaderboardLoading,
  setLeaderboard,
  updateLeaderboardUser,
  setIsTweetsLoading,
  setTweets,
  setIsModuleDetailsLoading,
  setModuleDetails,
  setModuleDetailsAttributeId,
  setNftDetails,
  setLogout,
} = setupSlice.actions;
export const setupReducer = setupSlice.reducer;

export type RootState = ReturnType<typeof store.getState>;

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
