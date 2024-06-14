import { createSlice } from '@reduxjs/toolkit';

interface LaunchState {}

const initialState: LaunchState = {};

export const launchSlice = createSlice({
  name: 'launch',
  initialState,
  reducers: {},
});

// export const {} = launchSlice.actions;
export const launchReducer = launchSlice.reducer;
