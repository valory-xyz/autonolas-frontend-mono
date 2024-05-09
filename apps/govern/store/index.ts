import { createWrapper } from 'next-redux-wrapper'
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { setupReducer } from './setup'

export const store = configureStore({
  reducer: {
    setup: setupReducer,
  }
})

export const wrapper = createWrapper(() => store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector