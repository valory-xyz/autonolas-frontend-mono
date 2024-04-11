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

const getEpochTokenomics = async ({ lastPoint }) => {
  const contract = getTokenomicsContract();
  const response = await contract.methods.mapEpochTokenomics(lastPoint).call();
  return response;
};

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

export const canShowCheckpoint = async () => {
  try {
    const epCounter = await getEpochCounter();
    const epTokenomics = await getEpochTokenomics({
      lastPoint: Number(epCounter) - 1,
    });
    const epochLen = await getEpochLength();
    const blockTimestamp = await getBlockTimestamp();
    const { endTime } = epTokenomics;

    if (blockTimestamp - endTime >= epochLen) {
      return true;
    }
    return false;
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

  const { pendingRelativeReward, pendingRelativeTopUp, lastEpoch } = response;

  // if the current epoch is the last epoch, calculate the incentives
  if (currentEpochCounter === lastEpoch) {
    const {
      rewardUnitFraction: aRewardFraction,
      topUpUnitFraction: aTopupFraction,
    } = agentInfo;
    const {
      rewardUnitFraction: cRewardFraction,
      topUpUnitFraction: cTopupFraction,
    } = componentInfo;

    /**
     * for unitType agent(0) & component(1),
     * the below formula is used to calculate the incentives
     */
    const componentPendingReward = (parseToEth(pendingRelativeReward) * cRewardFraction) / 100;
    const agentPendingReward = (parseToEth(pendingRelativeReward) * aRewardFraction) / 100;
    const componentPendingTopUp = (parseToEth(pendingRelativeTopUp) * cTopupFraction) / 100;
    const agentPendingTopUp = (parseToEth(pendingRelativeTopUp) * aTopupFraction) / 100;

    return {
      pendingRelativeReward:
        unitType === UNIT_TYPES.COMPONENT
          ? componentPendingReward
          : agentPendingReward,
      pendingRelativeTopUp:
        unitType === UNIT_TYPES.COMPONENT
          ? componentPendingTopUp
          : agentPendingTopUp,
      id: '0',
      key: '0',
    };
  }

  return {
    pendingRelativeReward: 0,
    pendingRelativeTopUp: 0,
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
    const prevEpochPoint = await getEpochTokenomics({
      lastPoint: Number(epCounter) - 1,
    });

    const prevEpochEndTime = prevEpochPoint.endTime;
    const epochLen = await getEpochLength();
    const nextEpochEndTime = parseInt(prevEpochEndTime, 10) + epochLen;

    return { epochLen, prevEpochEndTime, nextEpochEndTime };
  } catch (error) {
    notifyError('Error on fetching last epoch');
    throw error;
  }
};
