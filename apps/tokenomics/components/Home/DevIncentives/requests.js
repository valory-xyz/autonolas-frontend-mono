import { BigNumber } from 'ethers';
import { notifyError } from '@autonolas/frontend-library';

import {
  parseToEth,
  getDispenserContract,
  getTokenomicsContract,
  getTreasuryContract,
  getAgentContract,
  getComponentContract,
  getBlockTimestamp,
  sendTransaction,
} from 'common-util/functions';

import { UNIT_TYPES } from 'common-util/enums';

const fixTo8DecimalPlaces = (value) => {
  const numeralValue = Number(value);
  if (Number.isNaN(numeralValue)) return 0;
  return numeralValue > 0 ? numeralValue.toFixed(8) : 0;
};
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
//   uint96 sumUnitTopUpsOLAS; // [0]
//   uint32 numNewUnits;       // Number of new units [1]
//   uint8 rewardUnitFraction; // Reward component / agent fraction [2]
//   uint8 topUpUnitFraction;  // Top-up component / agent fraction [3]
// }
const getUnitPointReq = async ({ lastPoint, num }) => {
  const contract = getTokenomicsContract();
  const response = await contract.methods.getUnitPoint(lastPoint, num).call();
  return response;
};

const getEpochLength = async () => {
  const contract = getTokenomicsContract();
  const response = await contract.methods.epochLen().call();
  return parseInt(response, 10);
};

const getEpochDetails = async () => {
  const epCounter = await getEpochCounter();
  const epTokenomics = await getEpochTokenomics(Number(epCounter) - 1);
  const epochLen = await getEpochLength();
  const blockTimestamp = await getBlockTimestamp();
  const timeDiff = blockTimestamp - epTokenomics.endTime;

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

const getActualEpochTimeLength = async () => {
  try {
    const { timeDiff, epochLen } = await getEpochDetails();
    return timeDiff > epochLen ? timeDiff : epochLen;
  } catch (error) {
    console.error(error);
  }

  return 0;
};

export const getMapUnitIncentivesRequest = async ({ unitType, unitId }) => {
  const contract = getTokenomicsContract();

  const response = await contract.methods
    .mapUnitIncentives(unitType, unitId)
    .call();

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
  //   uint96 reward;                // Reward in ETH [0]
  //   uint96 pendingRelativeReward; // Pending relative reward in ETH [1]
  //   uint96 topUp;                 // Top-up in OLAS [2]
  //   uint96 pendingRelativeTopUp;  // Pending relative top-up [3]
  //   uint32 lastEpoch;             // Last epoch number the information was updated [4]
  // }
  const { pendingRelativeReward, pendingRelativeTopUp, lastEpoch } = response;

  const rewardInBn = BigNumber.from(pendingRelativeReward);
  const isCurrentEpochWithReward =
    currentEpochCounter === Number(lastEpoch) && rewardInBn.gt(0);

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
   * the below calulcation is done to get the reward and topup
   */
  const componentReward = rewardInBn.mul(cRewardFraction).div(100).toString();
  const agentReward = rewardInBn.mul(aRewardFraction).div(100).toString();

  let totalIncentives = BigNumber.from(pendingRelativeTopUp);
  let componentTopUp = 0;
  let agentPendingTopUp = 0;

  if (pendingRelativeTopUp > 0) {
    const inflationPerSecond = await contract.methods
      .inflationPerSecond()
      .call();
    const epochLength = await getActualEpochTimeLength();

    const totalTopUps = BigNumber.from(inflationPerSecond).mul(epochLength);
    totalIncentives = totalIncentives.mul(totalTopUps);

    const componentSumIncentivesInBn =
      BigNumber.from(cSumUnitTopUpsOLAS).mul(100);
    const agentSumIncentivesInBn = BigNumber.from(aSumUnitTopUpsOLAS).mul(100);

    componentTopUp = totalIncentives
      .mul(cTopupFraction)
      .div(componentSumIncentivesInBn)
      .toString();
    agentPendingTopUp = totalIncentives
      .mul(aTopupFraction)
      .div(agentSumIncentivesInBn)
      .toString();
  }

  const pendingRelativeTopUpInEth = parseToEth(
    unitType === UNIT_TYPES.COMPONENT ? componentReward : agentReward,
  );
  const componentTopUpInEth = parseToEth(
    unitType === UNIT_TYPES.COMPONENT ? componentTopUp : agentPendingTopUp,
  );

  return {
    pendingRelativeReward: fixTo8DecimalPlaces(pendingRelativeTopUpInEth),
    pendingRelativeTopUp: fixTo8DecimalPlaces(componentTopUpInEth),
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
