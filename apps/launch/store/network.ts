import { createSlice } from '@reduxjs/toolkit';

type NetworkState = {
  networkId: null | string;
  networkName: null | string;
};

const initialState: NetworkState = {
  networkId: null,
  networkName: null,
};

// dropdown network selection
export const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setNetworkId: (state, action) => {
      state.networkId = action.payload;
    },
    setNetworkName: (state, action) => {
      state.networkName = action.payload;
    },
    clearState: (state) => {},
  },
});

export const { setNetworkId, setNetworkName, clearState } = networkSlice.actions;
export const networkReducer = networkSlice.reducer;
