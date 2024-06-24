import { createSlice } from '@reduxjs/toolkit';

type NetworkState = {
  networkId: null | number;
  networkName: null | string;
  networkDisplayName: null | string;
};

const initialState: NetworkState = {
  networkId: null,
  networkName: null,
  networkDisplayName: null,
};

// dropdown network selection
export const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setNetworkDetails: (state, action) => {
      console.log('action.payload', action.payload);
      state.networkId = action.payload.networkId;
      state.networkName = action.payload.networkName;
      state.networkDisplayName = action.payload.networkDisplayName;
    },
    clearState: (state) => {},
  },
});

export const { setNetworkDetails, clearState } = networkSlice.actions;
export const networkReducer = networkSlice.reducer;
