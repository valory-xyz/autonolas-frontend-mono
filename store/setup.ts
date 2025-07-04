import { createSlice } from '@reduxjs/toolkit';
import { lowerCase, orderBy } from 'lodash';
import { TypedUseSelectorHook, useSelector } from 'react-redux';

import { store } from '.';
import { LeaderboardUser, ModuleDetails, Tweet } from './types';

type SetupState = {
  account: string | null;
  balance: number | null;
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

  // TODO: below to be removed
  nftDetails: any | null;
  isMemoryDetailsLoading: boolean;
  memoryDetails: any[];
  predictionRequests: any[];
  approvedRequestsCount: number | null;
  connection: any;
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

  // nft details
  nftDetails: null,

  // memory details
  isMemoryDetailsLoading: true,
  memoryDetails: [],
  predictionRequests: [],

  // orbis
  connection: {},
  approvedRequestsCount: null,
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
    setIsVerified: (state, action) => {
      state.isVerified = action.payload;
    },
    setIsLeaderboardLoading: (state, action) => {
      state.isLeaderboardLoading = action.payload;
    },
    setLeaderboard: (state, action) => {
      const leaderboard = action.payload;

      // orderBy (sort) 1. points, 2. name
      const values = orderBy(
        leaderboard,
        [(e) => parseInt(e.points, 10), (e) => lowerCase(e.name)],
        ['desc', 'asc'],
      );

      const rankedValues: LeaderboardUser[] = [];
      values.forEach((e, index) => {
        // setting rank for the first index
        if (index === 0) {
          rankedValues.push({ ...e, rank: 1 });
        } else {
          const previousMember = rankedValues[index - 1];
          rankedValues.push({
            ...e,
            rank:
              // if points are same as previous member, then same rank else add 1
              previousMember.points === e.points ? previousMember.rank : previousMember.rank + 1,
          });
        }
      });

      state.leaderboard = rankedValues;
    },
    setIsTweetsLoading: (state, action) => {
      state.isTweetsLoading = action.payload;
    },
    setTweets: (state, action) => {
      state.tweets = action.payload;
    },
    setIsModuleDetailsLoading: (state, action) => {
      state.isModuleDetailsLoading = action.payload;
    },
    setModuleDetails: (state, action) => {
      state.moduleDetails = action.payload;
    },
    setNftDetails: (state, action) => {
      state.nftDetails = action.payload;
    },
    setIsMemoryDetailsLoading: (state, action) => {
      state.isMemoryDetailsLoading = action.payload;
    },
    setMemoryDetails: (state, action) => {
      state.memoryDetails = action.payload;
    },
    setLogout: (state) => {
      state.account = null;
      state.balance = null;
      state.errorMessage = null;
      state.isVerified = false;
    },
    setPredictionRequests: (state, action) => {
      state.predictionRequests = action.payload;
    },
    setApprovedRequestsCount: (state, action) => {
      state.approvedRequestsCount = action.payload;
    },
    setOrbisConnection: (state, action) => {
      state.connection = action.payload;
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
  setIsTweetsLoading,
  setTweets,
  setIsModuleDetailsLoading,
  setModuleDetails,
  setNftDetails,
  setIsMemoryDetailsLoading,
  setMemoryDetails,
  setLogout,
  setPredictionRequests,
  setApprovedRequestsCount,
  setOrbisConnection,
} = setupSlice.actions;
export const setupReducer = setupSlice.reducer;

export type RootState = ReturnType<typeof store.getState>;

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
