import {
  getBlock,
  readContract,
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from '@wagmi/core';
import { Abi, Address } from 'viem';

import { rewardsFormatter } from 'libs/common-contract-functions/src/lib/utils';
import { TOKENOMICS_UNIT_TYPES } from 'libs/util-constants/src';
import {
  AGENT_REGISTRY,
  COMPONENT_REGISTRY,
  DISPENSER,
  TOKENOMICS,
  TREASURY,
} from 'libs/util-contracts/src/lib/abiAndAddresses';
import { notifyError } from 'libs/util-functions/src';

import { wagmiConfig } from 'components/Login/config';

import { getChainId } from 'common-util/functions';

const requireChainId = (): number => {
  const chainId = getChainId();
  if (chainId === undefined) throw new Error('Cannot determine chain ID');
  return chainId;
};

const tokenomicsParams = (chainId: number) => ({
  address: TOKENOMICS.addresses[chainId as keyof typeof TOKENOMICS.addresses] as Address,
  abi: TOKENOMICS.abi,
  chainId,
});

const treasuryParams = (chainId: number) => ({
  address: TREASURY.addresses[chainId as keyof typeof TREASURY.addresses] as Address,
  abi: TREASURY.abi,
  chainId,
});

const dispenserParams = (chainId: number) => ({
  address: DISPENSER.addresses[chainId as keyof typeof DISPENSER.addresses] as Address,
  abi: DISPENSER.abi,
  chainId,
});

// agent / component registry ABIs are not declared `as const` in the source `.js`
// files, so viem can't infer return types — `as Abi` is required and the
// `ownerOf` return must be cast manually.
const agentParams = (chainId: number) => ({
  address: AGENT_REGISTRY.addresses[chainId as keyof typeof AGENT_REGISTRY.addresses] as Address,
  abi: AGENT_REGISTRY.abi as Abi,
  chainId,
});

const componentParams = (chainId: number) => ({
  address: COMPONENT_REGISTRY.addresses[
    chainId as keyof typeof COMPONENT_REGISTRY.addresses
  ] as Address,
  abi: COMPONENT_REGISTRY.abi as Abi,
  chainId,
});

/** Fetches the owners of the units. */
export const getOwnersForUnits = async ({
  unitIds,
  unitTypes,
}: {
  unitIds: string[];
  unitTypes: string[];
}) => {
  const chainId = requireChainId();

  const ownersList = unitIds.map((unitId, i) => {
    // 1 = agent, 0 = component
    const params =
      unitTypes[i] === TOKENOMICS_UNIT_TYPES.AGENT
        ? agentParams(chainId)
        : componentParams(chainId);

    return readContract(wagmiConfig, {
      ...params,
      functionName: 'ownerOf',
      args: [BigInt(unitId)],
    }) as Promise<Address>;
  });

  return Promise.all(ownersList);
};

export const getOwnerIncentivesRequest = async ({
  address,
  unitTypes,
  unitIds,
}: {
  address: string;
  unitTypes: string[];
  unitIds: string[];
}) => {
  const chainId = requireChainId();
  const [reward, topUp] = await readContract(wagmiConfig, {
    ...tokenomicsParams(chainId),
    functionName: 'getOwnerIncentives',
    args: [address as Address, unitTypes.map(BigInt), unitIds.map(BigInt)],
  });
  return { reward, topUp };
};

export const claimOwnerIncentivesRequest = async ({
  account,
  unitTypes,
  unitIds,
}: {
  account: string;
  unitTypes: string[];
  unitIds: string[];
}) => {
  const chainId = requireChainId();
  const { request } = await simulateContract(wagmiConfig, {
    ...dispenserParams(chainId),
    functionName: 'claimOwnerIncentives',
    args: [unitTypes.map(BigInt), unitIds.map(BigInt)],
    account: account as Address,
  });
  const hash = await writeContract(wagmiConfig, request);
  const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
  return receipt.transactionHash;
};

export const checkpointRequest = async ({ account }: { account: string }) => {
  const chainId = requireChainId();
  const { request } = await simulateContract(wagmiConfig, {
    ...tokenomicsParams(chainId),
    functionName: 'checkpoint',
    account: account as Address,
  });
  const hash = await writeContract(wagmiConfig, request);
  return waitForTransactionReceipt(wagmiConfig, { hash });
};

export const getEpochCounter = async () => {
  const chainId = requireChainId();
  const response = await readContract(wagmiConfig, {
    ...tokenomicsParams(chainId),
    functionName: 'epochCounter',
  });
  return Number(response);
};

const getEpochTokenomics = async (epochNum: number) => {
  const chainId = requireChainId();
  return readContract(wagmiConfig, {
    ...tokenomicsParams(chainId),
    functionName: 'mapEpochTokenomics',
    args: [BigInt(epochNum)],
  });
};

const getEpochLength = async () => {
  const chainId = requireChainId();
  const response = await readContract(wagmiConfig, {
    ...tokenomicsParams(chainId),
    functionName: 'epochLen',
  });
  return Number(response);
};

const getBlockTimestamp = async () => {
  const chainId = requireChainId();
  const block = await getBlock(wagmiConfig, { blockTag: 'latest', chainId });
  return Number(block.timestamp);
};

const getEpochDetails = async () => {
  const epCounter = await getEpochCounter();
  const epTokenomics = await getEpochTokenomics(epCounter - 1);
  const epochLen = await getEpochLength();
  const blockTimestamp = await getBlockTimestamp();
  // `endTime` is a uint32 — viem returns it as `number` from the inferred ABI shape.
  const timeDiff = blockTimestamp - Number(epTokenomics.endTime);

  return { timeDiff, epochLen };
};

export const canShowCheckpoint = async () => {
  try {
    const { timeDiff, epochLen } = await getEpochDetails();
    return timeDiff >= epochLen;
  } catch (error) {
    console.error(error);
  }

  return false;
};

// Treasury `paused()` is a uint8 with three states (0 = unpaused, 1 = paused for
// claiming only, 2 = fully paused), not a bool. Returns `number`.
export const getPausedValueRequest = async () => {
  const chainId = requireChainId();
  const response = await readContract(wagmiConfig, {
    ...treasuryParams(chainId),
    functionName: 'paused',
  });
  return Number(response);
};

export const getLastEpochRequest = async () => {
  try {
    const epCounter = await getEpochCounter();
    const prevEpochPoint = await getEpochTokenomics(epCounter - 1);

    const prevEpochEndTime = Number(prevEpochPoint.endTime);
    const epochLen = await getEpochLength();
    const nextEpochEndTime = prevEpochEndTime + epochLen;

    return { epochLen, prevEpochEndTime, nextEpochEndTime };
  } catch (error) {
    notifyError('Error on fetching last epoch');
    throw error;
  }
};

const BIG_INT_0 = BigInt(0);
const BIG_INT_100 = BigInt(100);

export const getPendingIncentives = async ({
  unitType,
  unitId,
}: {
  unitType: string;
  unitId: string;
}) => {
  const chainId = requireChainId();
  const currentEpochCounter = await getEpochCounter();

  // mapUnitIncentives returns 5 top-level outputs (uint96, uint96, uint96, uint96,
  // uint32), so viem decodes it as a tuple — not an object with named fields.
  const unitIncentives = await readContract(wagmiConfig, {
    ...tokenomicsParams(chainId),
    functionName: 'mapUnitIncentives',
    args: [BigInt(unitType), BigInt(unitId)],
  });
  const [, pendingRelativeReward, , pendingRelativeTopUp, lastEpoch] = unitIncentives;

  const isCurrentEpochWithReward =
    currentEpochCounter === Number(lastEpoch) && pendingRelativeReward > BIG_INT_0;

  // if already received rewards this epoch, return zeroes
  if (!isCurrentEpochWithReward) {
    return {
      pendingReward: rewardsFormatter(BIG_INT_0, 4),
      pendingTopUp: rewardsFormatter(BIG_INT_0, 2),
    };
  }

  // getUnitPoint returns a struct with mixed uint8 (number) and uint96 (bigint)
  // fields. The uint8 fields must be wrapped in BigInt() before multiplying with
  // uint96 bigints — mixing throws `Cannot mix BigInt and other types`.
  const unitInfo = await readContract(wagmiConfig, {
    ...tokenomicsParams(chainId),
    functionName: 'getUnitPoint',
    args: [BigInt(currentEpochCounter), BigInt(unitType)],
  });

  const pendingReward = (pendingRelativeReward * BigInt(unitInfo.rewardUnitFraction)) / BIG_INT_100;

  let totalIncentives = pendingRelativeTopUp;
  let pendingTopUp = BIG_INT_0;

  if (totalIncentives > BIG_INT_0) {
    const inflationPerSecond = await readContract(wagmiConfig, {
      ...tokenomicsParams(chainId),
      functionName: 'inflationPerSecond',
    });

    const { timeDiff, epochLen } = await getEpochDetails();
    const epochLength = timeDiff > epochLen ? timeDiff : epochLen;

    const totalTopUps = inflationPerSecond * BigInt(epochLength);
    totalIncentives *= totalTopUps;

    pendingTopUp =
      (totalIncentives * BigInt(unitInfo.topUpUnitFraction)) /
      (unitInfo.sumUnitTopUpsOLAS * BIG_INT_100);
  }

  return {
    pendingReward: rewardsFormatter(pendingReward, 4),
    pendingTopUp: rewardsFormatter(pendingTopUp, 2),
  };
};
