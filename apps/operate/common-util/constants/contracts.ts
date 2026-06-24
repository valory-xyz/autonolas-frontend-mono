import { Address, formatEther } from 'viem';

import { Nominee, StakingContract } from 'types';

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
    availableOn: ['lst'],
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
  // Pearl Beta Mech MarketPlace V
  '0x000000000000000000000000536d04dbd9a2310152a0d2d8d18dadfca8bb26b0': {
    availableOn: ['pearl'],
  },
  // Pearl Beta Mech MarketPlace VI
  '0x000000000000000000000000ac3ed39d18d9c951bd2e7f0024114849c0a25295': {
    availableOn: ['pearl'],
  },
  // Pearl Beta Mech MarketPlace VII
  '0x000000000000000000000000b2303f9913f11131a74f4b05099ced2043cc72c4': {
    availableOn: ['pearl'],
  },
  // Pearl Beta Mech MarketPlace VIII
  '0x00000000000000000000000012bdd401ac300482f4017c64c6c930ee40424c08': {
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
  // Quickstart Beta - Expert 5
  '0x000000000000000000000000e56df1e563de1b10715cb313d514af350d207212': {
    availableOn: ['lst'],
  },
  // LST
  '0x00000000000000000000000022fa631064a99c43196ec5f8324b73211ced98f9': {
    availableOn: ['lst'],
  },
  // Quickstart Beta Mech MarketPlace - Expert 7
  '0x000000000000000000000000aaecdf4d0cbd6ca0622892ac6044472f3912a5f3': {
    availableOn: ['lst'],
  },
  // Quickstart Beta Mech MarketPlace - Expert 12
  '0x00000000000000000000000099fe6b5c9980fc3a44b1dc32a76db6adfcf4c75e': {
    availableOn: ['lst'],
  },
  // Quickstart Beta Mech MarketPlace - Expert 13
  '0x0000000000000000000000001f81cf353051daa8919d1777c58b667025794ddc': {
    availableOn: ['lst'],
  },
  // Basius I
  '0x0000000000000000000000000fb55cef7b12b76ea52900325461a5443f51b43f': {
    availableOn: ['pearl'],
  },
  // Basius II
  '0x000000000000000000000000728ca3b024ba4c273695df6e45e79db675b8c756': {
    availableOn: ['pearl'],
  },
  // Basius III
  '0x0000000000000000000000009593c4524df86f46935aa0ec996b4ccbe71c8234': {
    availableOn: ['pearl'],
  },
};

/**
 * Staking contracts to display on the contracts page even though they are not
 * currently registered as nominees in the VoteWeighting contract (e.g. de-nominated
 * but still relevant for a platform). These are merged into the nominees list and
 * fetched via RPC like any other contract. Live data (rewards pool, available slots)
 * will reflect their real on-chain state, which may be zero for drained contracts.
 */
export const EXTRA_STAKING_CONTRACTS: Nominee[] = [
  // Modius Alpha IV (Mode)
  {
    account: '0x0000000000000000000000008bcadb2c291c159f9385964e5ed95a9887302862',
    chainId: 34443n,
  },
  // Quickstart Beta - Expert 5 (Gnosis)
  {
    account: '0x000000000000000000000000e56df1e563de1b10715cb313d514af350d207212',
    chainId: 100n,
  },
];

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
