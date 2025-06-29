import { createWrapper } from 'next-redux-wrapper';
import { configureStore } from '@reduxjs/toolkit';

import setup from './setup';

export const store = configureStore({
  reducer: {
    setup,
  },
});

export const wrapper = createWrapper(() => store);
