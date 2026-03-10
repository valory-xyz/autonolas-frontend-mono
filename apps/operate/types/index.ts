import { Address } from 'viem';

export type Metadata = {
  name: string;
  description: string;
};

export type AvailableOn = 'pearl' | 'quickstart' | 'contribute';

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
  minOperatingBalance: number | null;
  minOperatingBalanceToken: string | null;
  minOperatingBalanceHint?: string;
  availableRewards: string;
  epoch: number;
  timeRemaining: string;
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
  minOperatingBalance?: number;
  minOperatingBalanceToken?: string | null;
  minOperatingBalanceHint?: string;
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
