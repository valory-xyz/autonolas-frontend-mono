import { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { Address } from 'viem';

import { MyStakingContract } from 'types/index';

/** The chain and account a published list was built for (account lowercased, null if none). */
export type MyStakingContractsOwner = { chainId: number | null; account: string | null };

/** A staking contract this session created, with the metadata Create already knew. */
export type CreatedStakingContract = {
  chainId: number;
  /** Creator, lowercased. */
  account: string;
  instance: Address;
  metadataHash: string;
  name: string;
  description: string;
};

type LaunchState = {
  isMyStakingContractsLoading: boolean;
  /** list of my staking contract */
  myStakingContracts: MyStakingContract[];
  /** Who `myStakingContracts` belongs to; null while nothing is published. */
  myStakingContractsOwner: MyStakingContractsOwner | null;
  /**
   * Discovery (squid or logs) failed after its retries: `myStakingContracts` holds only this
   * session's creations, and an empty list does not mean the account has no contracts.
   */
  isMyStakingContractsLookupFailed: boolean;
  /** Contracts created this session, kept until discovery (squid or logs) returns them too. */
  createdStakingContracts: CreatedStakingContract[];
  /** `${chainId}:${address}` (lowercased) nominated this session, kept until nominees include them. */
  confirmedNominations: string[];
};

const initialState: LaunchState = {
  isMyStakingContractsLoading: true,
  myStakingContracts: [],
  myStakingContractsOwner: null,
  isMyStakingContractsLookupFailed: false,
  createdStakingContracts: [],
  confirmedNominations: [],
};

export const nominationKey = (chainId: number, address: string) =>
  `${chainId}:${address.toLowerCase()}`;

export const launchSlice = createSlice({
  name: 'launch',
  initialState,
  reducers: {
    setMyStakingContracts: (
      state,
      action: PayloadAction<{
        owner: MyStakingContractsOwner;
        contracts: MyStakingContract[];
        isLookupFailed?: boolean;
      }>,
    ) => {
      state.myStakingContracts = action.payload.contracts;
      state.myStakingContractsOwner = action.payload.owner;
      state.isMyStakingContractsLookupFailed = !!action.payload.isLookupFailed;
      state.isMyStakingContractsLoading = false;
    },
    setContractsLoading: (state) => {
      state.isMyStakingContractsLoading = true;
      state.myStakingContracts = [];
      state.myStakingContractsOwner = null;
      state.isMyStakingContractsLookupFailed = false;
    },
    recordCreatedStakingContract: (state, action: PayloadAction<CreatedStakingContract>) => {
      const created = { ...action.payload, account: action.payload.account.toLowerCase() };
      const exists = state.createdStakingContracts.some(
        (item) =>
          item.chainId === created.chainId &&
          item.instance.toLowerCase() === created.instance.toLowerCase(),
      );
      if (!exists) state.createdStakingContracts.push(created);
    },
    /** Discovery returned these instances on `chainId`: it no longer needs the local copy. */
    reconcileCreatedStakingContracts: (
      state,
      action: PayloadAction<{ chainId: number; instances: string[] }>,
    ) => {
      const discovered = new Set(action.payload.instances.map((item) => item.toLowerCase()));
      state.createdStakingContracts = state.createdStakingContracts.filter(
        (item) =>
          item.chainId !== action.payload.chainId || !discovered.has(item.instance.toLowerCase()),
      );
    },
    /** A nomination receipt succeeded; keep the contract nominated until the nominee read agrees. */
    recordConfirmedNomination: (
      state,
      action: PayloadAction<{ chainId: number; address: string }>,
    ) => {
      const key = nominationKey(action.payload.chainId, action.payload.address);
      if (!state.confirmedNominations.includes(key)) state.confirmedNominations.push(key);
    },
    reconcileConfirmedNominations: (state, action: PayloadAction<string[]>) => {
      const included = new Set(action.payload);
      state.confirmedNominations = state.confirmedNominations.filter((key) => !included.has(key));
    },
  },
});

export const {
  setMyStakingContracts,
  setContractsLoading,
  recordCreatedStakingContract,
  reconcileCreatedStakingContracts,
  recordConfirmedNomination,
  reconcileConfirmedNominations,
} = launchSlice.actions;
export const launchReducer = launchSlice.reducer;
