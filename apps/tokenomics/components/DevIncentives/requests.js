import { notifyError } from '@autonolas/frontend-library';
import { TOKENOMICS_UNIT_TYPES } from 'libs/util-constants/src';

import {
  getAgentContract,
  getBlockTimestamp,
  getComponentContract,
  getDispenserContract,
  getTokenomicsContract,
  getTreasuryContract,
  sendTransaction,
} from 'common-util/functions';

/**
 * fetches the owners of the units
 */
export const getOwnersForUnits = async ({ unitIds, unitTypes }) => {
  const ownersList = [];

  const agentContract = getAgentContract();
  const componentContract = getComponentContract();

  for (let i = 0; i < unitIds.length; i += 1) {
    // 1 = agent, 0 = component
    if (unitTypes[i] === TOKENOMICS_UNIT_TYPES.AGENT) {
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

export const getOwnerIncentivesRequest = async ({ address, unitTypes, unitIds }) => {
  const contract = getTokenomicsContract();
  const response = await contract.methods.getOwnerIncentives(address, unitTypes, unitIds).call();
  return response;
};

export const claimOwnerIncentivesRequest = async ({ account, unitTypes, unitIds }) => {
  const contract = getDispenserContract();
  const fn = contract.methods.claimOwnerIncentives(unitTypes, unitIds).send({ from: account });

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
