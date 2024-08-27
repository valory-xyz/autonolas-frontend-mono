import { Contract, Provider, ethers } from 'ethers';

import { rewardsFormatter } from './utils';

const BIG_INT_0 = BigInt(0);
const BIG_INT_100 = BigInt(100);

const getEpochCounter = async (contract: Contract) => {
  const response: bigint = await contract.epochCounter();
  return response;
};

const getEpochDetails = async (provider: Provider, contract: Contract) => {
  const epCounter = await getEpochCounter(contract);

  // epoch tokenomics
  const epTokenomics: { endTime: bigint } = await contract.mapEpochTokenomics(
    epCounter - BigInt(1),
  );

  // epoch length
  const epochLen: bigint = await contract.epochLen();

  // get the block timestamp
  const blockTimestamp = (await provider.getBlock('latest'))?.timestamp || 0;
  const timeDiff = ethers.toBigInt(blockTimestamp) - epTokenomics.endTime;

  return { timeDiff, epochLen };
};

type MapUnitIncentivesRequestArgs = {
  provider: Provider;
  contract: Contract;
  unitType: string;
  unitId: string;
};

export const getPendingIncentives = async ({
  provider,
  contract,
  unitType,
  unitId,
}: MapUnitIncentivesRequestArgs) => {
  const currentEpochCounter = await getEpochCounter(contract);

  const {
    pendingRelativeReward,
    pendingRelativeTopUp,
    lastEpoch,
  }: {
    pendingRelativeReward: bigint; // Pending relative reward in ETH
    pendingRelativeTopUp: bigint; // Pending relative top-up
    lastEpoch: bigint;
  } = await contract.mapUnitIncentives(unitType, unitId);

  const isCurrentEpochWithReward =
    currentEpochCounter === lastEpoch && pendingRelativeReward > BIG_INT_0;

  // if already received rewards this epoch, return zeroes
  if (!isCurrentEpochWithReward) {
    return {
      pendingReward: rewardsFormatter(BigInt(0), 4),
      pendingTopUp: rewardsFormatter(BigInt(0), 2),
    };
  }

  // Get the unit points of the current epoch
  const unitInfo: {
    rewardUnitFraction: bigint;
    topUpUnitFraction: bigint;
    sumUnitTopUpsOLAS: bigint;
  } = await contract.getUnitPoint(currentEpochCounter, unitType);

  const pendingReward = (pendingRelativeReward * unitInfo.rewardUnitFraction) / BIG_INT_100;

  let totalIncentives = pendingRelativeTopUp;
  let pendingTopUp = BigInt(0);

  /**
   * the below calculation is done to get the reward and topup
   * based on current epoch length
   */
  if (totalIncentives > BIG_INT_0) {
    const inflationPerSecond: bigint = await contract.inflationPerSecond();

    const { timeDiff, epochLen } = await getEpochDetails(provider, contract);
    const epochLength = timeDiff > epochLen ? timeDiff : epochLen;

    const totalTopUps = inflationPerSecond * epochLength;
    totalIncentives = totalIncentives * totalTopUps;

    pendingTopUp =
      (totalIncentives * unitInfo.topUpUnitFraction) / (unitInfo.sumUnitTopUpsOLAS * BIG_INT_100);
  }

  return {
    pendingReward: rewardsFormatter(pendingReward, 4),
    pendingTopUp: rewardsFormatter(pendingTopUp, 2),
  };
};