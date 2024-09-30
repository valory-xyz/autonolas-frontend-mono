import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  agentInstancesAndOperators: [],
};

export const serviceSlice = createSlice({
  name: 'service',
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

export const { setAgentInstancesAndOperators, setStoreState } = serviceSlice.actions;
export const serviceReducer = serviceSlice.reducer;
