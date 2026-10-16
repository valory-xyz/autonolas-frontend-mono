import { Address, formatEther } from 'viem';

import { AvailableOn, Nominee, StakingContract } from 'types';

const ONE_YEAR = 1 * 24 * 60 * 60 * 365;

export type StakingContractDetailsInfo = {
  availableOn?: StakingContract['availableOn'];
  minOperatingBalance?: number;
  minOperatingBalanceToken?: string;
  minOperatingBalanceHint?: string;
};

/**
 * Only staking contracts that are live today (nominated and stakeable on a platform).
 * Nominees without an entry are listed under "Not available".
 */
export const STAKING_CONTRACT_DETAILS: Record<Address, StakingContractDetailsInfo> = {
  // LST
  '0x00000000000000000000000022fa631064a99c43196ec5f8324b73211ced98f9': {
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
  // Omenstrat I
  '0x0000000000000000000000001e215da0541b4a77a66e21f17413a877b84ab129': {
    availableOn: ['pearl'],
  },
  // Omenstrat II
  '0x000000000000000000000000c2bbfc0d2f5a341dcdcc9f3b78faf7b04f0244ff': {
    availableOn: ['pearl'],
  },
  // Omenstrat III
  '0x000000000000000000000000abd4f159a088e7f18fee8241cf9367f1d746780f': {
    availableOn: ['pearl'],
  },
  // Omenstrat IV
  '0x000000000000000000000000c9940b9daca9fdf1b0cd6de8e3d25dddc8c9fd0d': {
    availableOn: ['pearl'],
  },
  // Omenstrat V
  '0x00000000000000000000000093aaa7155942700cad74c250263fb2d0c6f72b27': {
    availableOn: ['pearl'],
  },
  // Omenstrat VI
  '0x000000000000000000000000b7ab6f7e6993df1f0c6a9b177b169faf4b0c9cca': {
    availableOn: ['pearl'],
  },
  // Omenstrat VII
  '0x000000000000000000000000b801fd1728eef27418fe03720b1ff3e769f35152': {
    availableOn: ['pearl'],
  },
  // Optimus I
  '0x000000000000000000000000cda7deef16f6b1bfc1bb5c89b7e4faa91d9ebf7b': {
    availableOn: ['pearl'],
  },
  // Optimus II
  '0x000000000000000000000000746281b8fbdbd008729dc9382392810f771b1bfd': {
    availableOn: ['pearl'],
  },
  // Optimus III
  '0x0000000000000000000000005a4317a5695ad6e86744efc824414cf899f07c68': {
    availableOn: ['pearl'],
  },
  // Polystrat I
  '0x00000000000000000000000035c9c87a8cad9b7fd9d367eb4fd287365688e000': {
    availableOn: ['pearl'],
  },
  // Polystrat II
  '0x000000000000000000000000d7f69649691039e86f15153c7bd567aa0049d122': {
    availableOn: ['pearl'],
  },
  // Polystrat III
  '0x0000000000000000000000007dbf10769ca7528ec9aa440b668c716caf08e7ea': {
    availableOn: ['pearl'],
  },
  // Polystrat IV
  '0x000000000000000000000000b7d3bad3a08889838096b4b583fa6785c614d0a5': {
    availableOn: ['pearl'],
  },
  // Polystrat V
  '0x0000000000000000000000004c367f1df1e16263d55a896c0909cca7333d835f': {
    availableOn: ['pearl'],
  },
  // Polystrat VI
  '0x000000000000000000000000f7f371f2e72e326d42323562a14ed01ff5a53d12': {
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
export const EXTRA_STAKING_CONTRACTS: Nominee[] = [];

/**
 * Nominees plus the extra contracts this app surfaces, skipping any already present.
 * Used by both the ISR fetch and the client hook — if they build different lists, the
 * pre-rendered table and the hydrated one disagree.
 */
export const withExtraStakingContracts = <T extends { account: string }>(nominees: T[]): T[] => {
  const existing = new Set(nominees.map((n) => n.account.toLowerCase()));
  const extras = EXTRA_STAKING_CONTRACTS.filter((e) => !existing.has(e.account.toLowerCase()));
  return [...nominees, ...(extras as unknown as T[])];
};

/**
 * The platforms a staking contract can be run on. The server (ISR) and the client both sanitize
 * `availableOn` against this list, so the Live / Not-available split cannot differ between the
 * pre-rendered HTML and the hydrated table.
 */
export const AVAILABLE_ON_VALUES: AvailableOn[] = ['pearl', 'contribute', 'lst'];

export const AVAILABLE_ON_LABELS: Record<AvailableOn, string> = {
  pearl: 'Pearl',
  contribute: 'Contribute',
  lst: 'LST',
};

const AVAILABLE_ON_SET = new Set<AvailableOn>(AVAILABLE_ON_VALUES);

/** Keeps only recognised platforms; returns null when the value is not a list. */
export const sanitizeAvailableOn = (value: unknown): AvailableOn[] | null => {
  if (!Array.isArray(value)) return null;
  return value.filter((p): p is AvailableOn => AVAILABLE_ON_SET.has(p as AvailableOn));
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

/**
 * Absolute end of the current epoch as ISO-8601 UTC: the last checkpoint plus the liveness
 * period. Independent of the current block, so the server and client agree, and unlike a
 * countdown it does not decay while the pre-rendered HTML sits in cache.
 */
export const getEpochEndsAt = (
  tsCheckpointSeconds: number,
  livenessPeriodSeconds: number,
): string | null => {
  if (!tsCheckpointSeconds || !livenessPeriodSeconds) return null;
  return new Date((tsCheckpointSeconds + livenessPeriodSeconds) * 1000).toISOString();
};

export const getTimeRemainingFormatted = (timeRemainingSeconds: number): string => {
  const days = Math.floor(timeRemainingSeconds / 86400);
  const hours = Math.floor((timeRemainingSeconds % 86400) / 3600);
  const minutes = Math.floor((timeRemainingSeconds % 3600) / 60);
  return `${days}D ${hours}H ${minutes}M`;
};
