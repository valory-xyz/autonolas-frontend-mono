import { configureStore } from '@reduxjs/toolkit'
import { setupReducer } from './setupSlice'

export const store = configureStore({
  reducer: {
    setup: setupReducer
  }
})
