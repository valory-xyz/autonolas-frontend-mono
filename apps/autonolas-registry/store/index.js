import { createWrapper } from 'next-redux-wrapper';
import { configureStore } from '@reduxjs/toolkit';
import { setupReducer } from './setup';
import { serviceReducer } from './service';

export const store = configureStore({
  reducer: {
    setup: setupReducer,
    service: serviceReducer,
  },
});

export const wrapper = createWrapper(() => store);
