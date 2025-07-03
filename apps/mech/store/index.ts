import { createWrapper } from 'next-redux-wrapper';
import { TypedUseSelectorHook, useSelector } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import setup from './setup';
import { RootState } from './types';

export const store = configureStore({
  reducer: {
    setup,
  },
});

export const wrapper = createWrapper(() => store);

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
