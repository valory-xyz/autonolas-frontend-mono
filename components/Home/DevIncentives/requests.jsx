import { notifyError } from '@autonolas/frontend-library';

import { UNIT_TYPES } from 'util/constants';
import {
  getBlockTimestamp,
  parseToEth,
  sendTransaction,
} from 'common-util/functions';
import {
  getDispenserContract,
  getTokenomicsContract,
  getTreasuryContract,
  getAgentContract,
  getComponentContract,
} from 'common-util/Contracts';

/**
 * fetches the owners of the units
 */
export const getOwnersForUnits = async ({ unitIds, unitTypes }) => {
  const ownersList = [];

  const agentContract = getAgentContract();
  const componentContract = getComponentContract();

  for (let i = 0; i < unitIds.length; i += 1) {
    // 1 = agent, 0 = component
    if (unitTypes[i] === UNIT_TYPES.AGENT) {
      const result = agentContract.methods.ownerOf(unitIds[i]).call();
      ownersList.push(result);
    } else {
      const result = componentContract.methods.ownerOf(unitIds[i]).call();
      ownersList.push(result);
    }
  }

  const list = await Promise.all(ownersList);
  const results = await Promise.all(list.map((e) => e));
  return results;
};

export const getOwnerIncentivesRequest = async ({
  address,
  unitTypes,
  unitIds,
}) => {
  const contract = getTokenomicsContract();
  const response = await contract.methods
    .getOwnerIncentives(address, unitTypes, unitIds)
    .call();
  return response;
};

export const claimOwnerIncentivesRequest = async ({
  account,
  unitTypes,
  unitIds,
}) => {
  const contract = getDispenserContract();
  const fn = contract.methods
    .claimOwnerIncentives(unitTypes, unitIds)
    .send({ from: account });

  const response = await sendTransaction(fn, account);
  return response?.transactionHash;
};

export const checkpointRequest = async ({ account }) => {
  const contract = getTokenomicsContract();
  const fn = contract.methods.checkpoint().send({ from: account });
  const response = await sendTransaction(fn, account);
  return response;
};

export const getEpochCounter = async () => {
  const contract = getTokenomicsContract();
  const response = await contract.methods.epochCounter().call();
  return parseInt(response, 10);
};

const getEpochTokenomics = async (epochNum) => {
  const contract = getTokenomicsContract();
  const response = await contract.methods.mapEpochTokenomics(epochNum).call();
  return response;
};

// Structure for component / agent point with tokenomics-related statistics
// struct UnitPoint {
// // Summation of all the relative OLAS top-ups accumulated by
// each component / agent in a service
//   uint96 sumUnitTopUpsOLAS; [0]
//   uint32 numNewUnits; // Number of new units [1]
//   uint8 rewardUnitFraction; // Reward component / agent fraction [2]
//   uint8 topUpUnitFraction; // Top-up component / agent fraction [3]
// }
const getUnitPointReq = async ({ lastPoint, num }) => {
  const contract = getTokenomicsContract();
  const response = await contract.methods.getUnitPoint(lastPoint, num).call();
  console.log('getUnitPointReq: ', response);
  return response;
};

const getEpochLength = async () => {
  const contract = getTokenomicsContract();
  const response = await contract.methods.epochLen().call();
  return parseInt(response, 10);
};

export const canShowCheckpoint = async (
  checkOnlyIfEpochLenIsGreater = false,
) => {
  try {
    const epCounter = await getEpochCounter();
    const epTokenomics = await getEpochTokenomics(Number(epCounter) - 1);
    const epochLen = await getEpochLength();
    const blockTimestamp = await getBlockTimestamp();
    const timeDiff = blockTimestamp - epTokenomics.endTime;

    return checkOnlyIfEpochLenIsGreater
      ? timeDiff > epochLen
      : timeDiff >= epochLen;
  } catch (error) {
    console.error(error);
  }

  return false;
};

export const getMapUnitIncentivesRequest = async ({ unitType, unitId }) => {
  const contract = getTokenomicsContract();

  const response = await contract.methods
    .mapUnitIncentives(unitType, unitId)
    .call();

  console.log(response);

  const currentEpochCounter = await getEpochCounter();

  // Get the unit points of the last epoch
  const componentInfo = await getUnitPointReq({
    lastPoint: currentEpochCounter,
    num: 0,
  });

  const agentInfo = await getUnitPointReq({
    lastPoint: currentEpochCounter,
    num: 1,
  });

  // Struct for component / agent incentive balances
  // struct IncentiveBalances {
  //   uint96 reward; // Reward in ETH [0]
  //   uint96 pendingRelativeReward; // Pending relative reward in ETH [1]
  //   uint96 topUp; // Top-up in OLAS [2]
  //   uint96 pendingRelativeTopUp; // Pending relative top-up [3]
  //   uint32 lastEpoch;  // Last epoch number the information was updated [4]
  // }
  const { pendingRelativeReward, pendingRelativeTopUp, lastEpoch } = response;

  // let agentTotalIncentives = 0;
  // let pendingRelativeRewardTemp = 0;

  const rewardInEth = parseToEth(pendingRelativeReward);
  const isCurrentEpochWithReward = currentEpochCounter === Number(lastEpoch) && rewardInEth > 0;

  // if the current epoch is not the last epoch, return 0
  if (!isCurrentEpochWithReward) {
    return {
      pendingRelativeReward: 0,
      pendingRelativeTopUp: 0,
      id: '0',
      key: '0',
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
   * the below formula is used to calculate the incentives
   */
  const componentReward = (rewardInEth * cRewardFraction) / 100;
  const agentReward = (rewardInEth * aRewardFraction) / 100;

  let totalIncentives = parseToEth(pendingRelativeTopUp);
  let componentTopUp = 0;
  let agentPendingTopUp = 0;

  if (pendingRelativeTopUp > 0) {
    const inflationPerEpoch = await contract.methods
      .getInflationPerEpoch()
      .call();
    const inflationPerSecond = await contract.methods
      .inflationPerSecond()
      .call();
    const epochLength = await getEpochLength();
    const isValid = await canShowCheckpoint(true);

    console.log({
      totalIncentivesInEth: totalIncentives,
      inflationPerEpochInEth: parseToEth(inflationPerEpoch),
      inflationPerSecondInEth: parseToEth(inflationPerSecond),
      epochLength,
      isValid,
    });

    const totalTopUps = isValid
      ? parseToEth(inflationPerSecond) * epochLength
      : parseToEth(inflationPerEpoch);
    totalIncentives *= totalTopUps;
    console.log({ totalTopUps });

    const componentSumIncentivesInEth = parseToEth(cSumUnitTopUpsOLAS) * 100;
    const agentSumIncentivesInEth = parseToEth(aSumUnitTopUpsOLAS) * 100;

    componentTopUp = (totalIncentives * cTopupFraction) / componentSumIncentivesInEth;
    agentPendingTopUp = (totalIncentives * aTopupFraction) / agentSumIncentivesInEth;
    console.log({
      aTopupFraction,
      aSumUnitTopUpsOLASInEth: parseToEth(aSumUnitTopUpsOLAS),
      agentPendingTopUp,
    });
  }

  return {
    pendingRelativeReward:
      unitType === UNIT_TYPES.COMPONENT ? componentReward : agentReward,
    pendingRelativeTopUp:
      unitType === UNIT_TYPES.COMPONENT ? componentTopUp : agentPendingTopUp,
    id: '0',
    key: '0',
  };
};

export const getPausedValueRequest = async () => {
  const contract = getTreasuryContract();
  const response = await contract.methods.paused().call();
  return response;
};

export const getLastEpochRequest = async () => {
  try {
    const epCounter = await getEpochCounter();
    const prevEpochPoint = await getEpochTokenomics(Number(epCounter) - 1);

    const prevEpochEndTime = prevEpochPoint.endTime;
    const epochLen = await getEpochLength();
    const nextEpochEndTime = parseInt(prevEpochEndTime, 10) + epochLen;

    return { epochLen, prevEpochEndTime, nextEpochEndTime };
  } catch (error) {
    notifyError('Error on fetching last epoch');
    throw error;
  }
};
