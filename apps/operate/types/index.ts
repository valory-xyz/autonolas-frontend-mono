import { Address } from 'viem';

export type Metadata = {
  name: string;
  description: string;
};

export type AvailableOn = 'pearl' | 'contribute' | 'lst';

export type StakingContract = {
  key: Address;
  address: Address;
  chainId: number;
  metadata: Metadata;
  availableSlots: number;
  maxSlots: number;
  apy: number;
  stakeRequired: string;
  availableOn: AvailableOn[] | null;
  availableRewards: string;
  epoch: number;
  /** Relative countdown for display. Goes stale the moment it is cached — see `epochEndsAt`. */
  timeRemaining: string;
  /**
   * Absolute end of the current epoch, ISO-8601 UTC, or null when it cannot be derived.
   * Pre-rendered HTML is served for minutes, so the countdown in `timeRemaining` is wrong by
   * the time most readers see it; this stays true however long the page is cached.
   */
  epochEndsAt: string | null;
};

export type Nominee = {
  account: Address;
  chainId: bigint;
};

export type CachedContractConfig = {
  maxNumServices: number;
  rewardsPerSecond: string;
  minStakingDeposit: string;
  numAgentInstances: string;
  livenessPeriod: string;
};

export type CachedContractMetadata = {
  name: string;
  description: string;
};

export type CachedOperateDetails = {
  availableOn: AvailableOn[] | null;
};

export type ContractCacheData = {
  config: CachedContractConfig;
  metadata: CachedContractMetadata;
  operateDetails: CachedOperateDetails;
};

export type ContractCacheSnapshot = {
  data: ContractCacheData;
  timestamp: number;
};
