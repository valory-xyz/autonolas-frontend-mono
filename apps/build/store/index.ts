import { configureStore } from '@reduxjs/toolkit';
import { createWrapper } from 'next-redux-wrapper';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import setup from './setup';

export const store = configureStore({
  reducer: {
    setup,
  },
  devTools: process.env.NODE_ENV === 'development',
});

export const wrapper = createWrapper(() => store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// For backward compatibility with existing code that imports initStore
const initStore = () => store;
export default initStore;
