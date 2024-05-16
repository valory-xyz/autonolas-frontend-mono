import { configureStore } from '@reduxjs/toolkit';
import { createWrapper } from 'next-redux-wrapper';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import { governReducer } from './govern';
import { setupReducer } from './setup';

export const store = configureStore({
  reducer: {
    setup: setupReducer,
    govern: governReducer,
  },
});

export const wrapper = createWrapper(() => store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
