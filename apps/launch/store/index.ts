import { configureStore } from '@reduxjs/toolkit';
import { createWrapper } from 'next-redux-wrapper';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import { launchReducer } from './launch';
import { networkReducer } from './network';

export const store = configureStore({
  reducer: {
    launch: launchReducer,
    network: networkReducer,
  },
});

export const wrapper = createWrapper(() => store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
