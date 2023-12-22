import { configureStore } from '@reduxjs/toolkit'
import { setupReducer } from './setup'
import { stateReducer } from './state'

export const store = configureStore({
  reducer: {
    setup: setupReducer,
    state: stateReducer
  }
})
