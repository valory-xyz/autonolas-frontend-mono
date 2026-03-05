import { Address } from 'viem';

export type Metadata = {
  name: string;
  description: string;
};

export type Weight = { percentage: number; value: number };

export type StakingContract = {
  address: Address;
  chainId: number;
  metadata: Metadata;
  currentWeight: Weight;
  nextWeight: Weight;
};

export type GovernContractCacheConfig = {
  maxNumServices: string;
  rewardsPerSecond: string;
  minStakingDeposit: string;
  livenessPeriod: string;
  minStakingDuration: string;
  maxNumInactivityPeriods: string;
  timeForEmissions: string;
  numAgentInstances: string;
  agentIds: string[];
  threshold: string;
  configHash: string;
  proxyHash: string;
  activityChecker: string;
};

export type GovernContractCacheInstanceParams = {
  implementation: string;
  deployer: string;
  isEnabled: boolean;
};

export type GovernContractCacheData = {
  metadata: Metadata;
  config: GovernContractCacheConfig;
  instanceParams: GovernContractCacheInstanceParams | null;
};

export type GovernContractCacheSnapshot = {
  data: GovernContractCacheData;
  timestamp: number;
};
