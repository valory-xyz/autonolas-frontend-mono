import { createSlice } from '@reduxjs/toolkit';

interface LaunchState {}

const initialState: LaunchState = {};

export const launchSlice = createSlice({
  name: 'launch',
  initialState,
  reducers: {
    clearState: (state) => {},
  },
});

export const { clearState } = launchSlice.actions;
export const launchReducer = launchSlice.reducer;
