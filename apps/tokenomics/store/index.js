import { configureStore } from '@reduxjs/toolkit';
import { setupReducer } from './setup';

export const store = configureStore({
  reducer: {
    setup: setupReducer,
  },
});
