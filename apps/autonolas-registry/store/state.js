import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  agentInstancesAndOperators: []
};

export const stateSlice = createSlice({
  name: 'setup',
  initialState,
  reducers: {
    setAgentInstancesAndOperators: (state, action) => {
      state.agentInstancesAndOperators = action.payload;
    },
    setStoreState: (state, action) => {
      state = action.payload;
    },
  },
});

export const {
  setAgentInstancesAndOperators,
  setStoreState,
} = stateSlice.actions;
export const stateReducer = stateSlice.reducer; 
