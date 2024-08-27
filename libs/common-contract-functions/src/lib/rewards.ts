import { Contract, Provider, ethers } from 'ethers';
import { UNIT_TYPES } from 'libs/util-constants/src';

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

  // get the block number and timestamp
  const blockNumber = await provider.getBlockNumber();

  const blockTimestamp = (await provider.getBlock(blockNumber))?.timestamp || 0;
  const timeDiff = ethers.toBigInt(blockTimestamp) - epTokenomics.endTime;

  return { timeDiff, epochLen };
};

type MapUnitIncentivesRequestArgs = {
  provider: Provider;
  contract: Contract;
  unitType: string;
  unitId: string;
};

const getMapUnitIncentivesRequest = async ({
  provider,
  contract,
  unitType,
  unitId,
}: MapUnitIncentivesRequestArgs) => {
  const currentEpochCounter = await getEpochCounter(contract);

  // Get the unit points of the last epoch
  const componentInfo: {
    rewardUnitFraction: bigint;
    topUpUnitFraction: bigint;
    sumUnitTopUpsOLAS: bigint;
  } = await contract.getUnitPoint(currentEpochCounter, 0);
  const agentInfo: {
    rewardUnitFraction: bigint;
    topUpUnitFraction: bigint;
    sumUnitTopUpsOLAS: bigint;
  } = await contract.getUnitPoint(currentEpochCounter, 1);

  const {
    pendingRelativeReward,
    pendingRelativeTopUp,
    lastEpoch,
  }: {
    pendingRelativeReward: bigint;
    pendingRelativeTopUp: bigint;
    lastEpoch: bigint;
  } = await contract.mapUnitIncentives(unitType, unitId);
  // Struct for component / agent incentive balances
  // struct IncentiveBalances {
  //   uint96 reward;                // Reward in ETH [0]
  //   uint96 pendingRelativeReward; // Pending relative reward in ETH [1]
  //   uint96 topUp;                 // Top-up in OLAS [2]
  //   uint96 pendingRelativeTopUp;  // Pending relative top-up [3]
  //   uint32 lastEpoch;             // Last epoch number the information was updated [4]
  // }

  const isCurrentEpochWithReward =
    currentEpochCounter === lastEpoch && pendingRelativeReward > BIG_INT_0;

  // if the current epoch is not the last epoch, return 0
  if (!isCurrentEpochWithReward) {
    return {
      pendingRelativeReward: '0.0000',
      pendingRelativeTopUp: '0.00',
    };
  }

  // if the current epoch is the last epoch, calculate the incentives
  const {
    rewardUnitFraction: cRewardFraction,
    topUpUnitFraction: cTopupFraction,
    sumUnitTopUpsOLAS: cSumUnitTopUpsOLAS,
  } = componentInfo;
  const {
    rewardUnitFraction: aRewardFraction,
    topUpUnitFraction: aTopupFraction,
    sumUnitTopUpsOLAS: aSumUnitTopUpsOLAS,
  } = agentInfo;

  /**
   * for unitType agent(0) & component(1),
   * the below calculation is done to get the reward and topup
   */
  const componentReward = (pendingRelativeReward * cRewardFraction) / BIG_INT_100;
  const agentReward = (pendingRelativeReward * aRewardFraction) / BIG_INT_100;

  let totalIncentives = pendingRelativeTopUp;
  let componentTopUp = BigInt(0);
  let agentPendingTopUp = BigInt(0);

  if (pendingRelativeTopUp > BIG_INT_0) {
    const inflationPerSecond: bigint = await contract.inflationPerSecond();

    const { timeDiff, epochLen } = await getEpochDetails(provider, contract);
    const epochLength = timeDiff > epochLen ? timeDiff : epochLen;

    const totalTopUps = inflationPerSecond * epochLength;
    totalIncentives = totalIncentives * totalTopUps;

    componentTopUp = (totalIncentives * cTopupFraction) / (cSumUnitTopUpsOLAS * BIG_INT_100);
    agentPendingTopUp = (totalIncentives * aTopupFraction) / (aSumUnitTopUpsOLAS * BIG_INT_100);
  }

  const isComponent = unitType === UNIT_TYPES.COMPONENT;
  const pendingRelativeTopUpInWei = isComponent ? componentReward : agentReward;
  const componentTopUpInWei = isComponent ? componentTopUp : agentPendingTopUp;

  return {
    pendingRelativeReward: rewardsFormatter(pendingRelativeTopUpInWei, 4),
    pendingRelativeTopUp: rewardsFormatter(componentTopUpInWei, 2),
  };
};

// TODO: unable to import TOKENOMICS from util-contracts as of now
// once the import is fixed, remove provider and contract from the function signature
export const getPendingIncentives = async (
  provider: Provider,
  contract: Contract,
  unitType: string,
  unitId: string,
): Promise<{ reward: string; topUp: string }> => {
  const { pendingRelativeReward, pendingRelativeTopUp } = await getMapUnitIncentivesRequest({
    provider,
    contract,
    unitType,
    unitId,
  });

  return {
    reward: pendingRelativeReward,
    topUp: pendingRelativeTopUp,
  };
};
