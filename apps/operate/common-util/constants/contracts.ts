import { Address, formatEther } from 'viem';

import { StakingContract } from 'types';

const ONE_YEAR = 1 * 24 * 60 * 60 * 365;

export type StakingContractDetailsInfo = {
  availableOn?: StakingContract['availableOn'];
  minOperatingBalance?: number;
  minOperatingBalanceToken?: string;
  minOperatingBalanceHint?: string;
};

export const STAKING_CONTRACT_DETAILS: Record<Address, StakingContractDetailsInfo> = {
  // Optimus Alpha IV
  '0x0000000000000000000000006891cf116f9a3bdbd1e89413118ef81f69d298c3': {
    availableOn: ['pearl'],
  },
  // Optimus Alpha (optimism)
  '0x00000000000000000000000088996bbde7f982d93214881756840ce2c77c4992': {
    availableOn: ['pearl'],
  },
  // Optimus Alpha III
  '0x0000000000000000000000000f69f35652b1acdbd769049334f1ac580927e139': {
    availableOn: ['pearl'],
  },
  // Optimus Alpha (mode)
  '0x0000000000000000000000005fc25f50e96857373c64dc0edb1abcbed4587e91': {
    availableOn: ['pearl'],
  },
  // Modius Alpha
  '0x000000000000000000000000534c0a05b6d4d28d5f3630d6d74857b253cf8332': {
    availableOn: ['pearl'],
  },
  // Optimus Alpha II
  '0x000000000000000000000000bca056952d2a7a8dd4a002079219807cfdf9fd29': {
    availableOn: ['pearl'],
  },
  // MemeBase Alpha II
  '0x000000000000000000000000c653622fd75026a020995a1d8c8651316cbbc4da': {
    availableOn: ['pearl'],
  },
  // Modius Alpha II
  '0x000000000000000000000000ec013e68fe4b5734643499887941ec197fd757d0': {
    availableOn: ['pearl'],
  },
  // Modius Alpha III
  '0x0000000000000000000000009034d0413d122015710f1744a19efb1d7c2ceb13': {
    availableOn: ['pearl'],
  },
  // Modius Alpha IV
  '0x0000000000000000000000008bcadb2c291c159f9385964e5ed95a9887302862': {
    availableOn: ['pearl'],
  },
  // MemeBase Beta I
  '0x0000000000000000000000006011e09e7c095e76980b22498d69df18eb62bed8': {
    availableOn: ['pearl'],
  },
  // MemeBase Beta II
  '0x000000000000000000000000fb7669c3adf673b3a545fa5acd987dbfda805e22': {
    availableOn: ['pearl'],
  },
  // MemeBase Beta III
  '0x000000000000000000000000ca61633b03c54f64b6a7f1f9a9c0a6feb231cc4d': {
    availableOn: ['pearl'],
  },
  // Contribute Beta I
  '0x000000000000000000000000e2e68ddafbdc0ae48e39cdd1e778298e9d865cf4': {
    availableOn: ['contribute'],
  },
  // Contribute Beta II
  '0x0000000000000000000000006ce93e724606c365fc882d4d6dfb4a0a35fe2387': {
    availableOn: ['contribute'],
  },
  // Contribute Beta III
  '0x00000000000000000000000028877ffc6583170a4c9ed0121fc3195d06fd3a26': {
    availableOn: ['contribute'],
  },
  // Agents.fun 1
  '0x0000000000000000000000002585e63df7bd9de8e058884d496658a030b5c6ce': {
    availableOn: ['pearl'],
  },
  // Agents.fun 2
  '0x00000000000000000000000026fa75ef9ccaa60e58260226a71e9d07564c01bf': {
    availableOn: ['pearl'],
  },
  // Agents.fun 3
  '0x0000000000000000000000004d4233ebf0473ca8f34d105a6256a2389176f0ce': {
    availableOn: ['pearl'],
  },
  // Pearl Beta Mech MarketPlace I
  '0x000000000000000000000000ab10188207ea030555f53c8a84339a92f473aa5e': {
    availableOn: ['pearl'],
  },
  // Pearl Beta Mech MarketPlace II
  '0x0000000000000000000000008d7be092d154b01d404f1accfa22cef98c613b5d': {
    availableOn: ['pearl'],
  },
  // Pearl Beta Mech MarketPlace III
  '0x0000000000000000000000009d00a0551f20979080d3762005c9b74d7aa77b85': {
    availableOn: ['pearl'],
  },
  // Pearl Beta Mech MarketPlace IV
  '0x000000000000000000000000e2f80659db1069f3b6a08af1a62064190c119543': {
    availableOn: ['pearl'],
  },
  // Pett.AI Agent Staking Contract
  '0x000000000000000000000000fa0ca3935758cb81d35a8f1395b9eb5a596ce301': {
    availableOn: ['pearl'],
  },
  // Pett.AI Agent Staking Contract 2
  '0x00000000000000000000000000d544c10bdc0e9b0a71ceaf52c1342bb8f21c1d': {
    availableOn: ['pearl'],
  },
  // Polymarket Beta - I
  '0x0000000000000000000000009f1936f6afb5eaaa2220032cf5e265f2cc9511cc': {
    availableOn: ['pearl'],
  },
  // Polymarket Beta - II
  '0x00000000000000000000000022d58680f643333f93205b956a4aa1dc203a16ad': {
    availableOn: ['pearl'],
  },
  // Polymarket Alpha - III
  '0x0000000000000000000000008887c2852986e7cbac99b6065ffe53074a6bcc26': {
    availableOn: ['pearl'],
  },
};

export const getApy = (
  rewardsPerSecond: bigint,
  minStakingDeposit: bigint,
  maxNumAgentInstances: bigint,
): number | null => {
  if (!minStakingDeposit || !rewardsPerSecond) return null;

  const rewardsPerYear = rewardsPerSecond * BigInt(ONE_YEAR);
  const apy = (rewardsPerYear * BigInt(100)) / minStakingDeposit;
  return Number(apy) / (1 + Number(maxNumAgentInstances));
};

export const getStakeRequired = (
  minStakingDeposit: bigint,
  numAgentInstances: bigint,
): string | null => {
  if (!minStakingDeposit || !numAgentInstances) return null;

  return formatEther(minStakingDeposit + minStakingDeposit * numAgentInstances);
};

export const getTimeRemainingFormatted = (timeRemainingSeconds: number): string => {
  const days = Math.floor(timeRemainingSeconds / 86400);
  const hours = Math.floor((timeRemainingSeconds % 86400) / 3600);
  const minutes = Math.floor((timeRemainingSeconds % 3600) / 60);
  return `${days}D ${hours}H ${minutes}M`;
};
