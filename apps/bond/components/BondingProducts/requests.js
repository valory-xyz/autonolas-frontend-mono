import { notifyError } from 'libs/util-functions/src';
import {
  getDepositoryContract,
  getTokenomicsContract,
  sendTransaction,
} from 'common-util/functions';

export const getBondInfoRequest = async (bondList) => {
  const contract = getDepositoryContract();

  try {
    const bondListPromise = [];

    for (let i = 0; i < bondList.length; i += 1) {
      const result = contract.methods.mapUserBonds(bondList[i].bondId).call();
      bondListPromise.push(result);
    }

    const lpTokenNameList = await Promise.all(bondListPromise);

    return bondList.map((component, index) => ({
      ...component,
      maturityDate: lpTokenNameList[index].maturity * 1000,
    }));
  } catch (error) {
    window.console.log('Error on fetching bond info');
    return bondList;
  }
};

/**
 * Bonding functionalities
 */
const getBondsRequest = async ({ account, isActive: isBondMatured }) => {
  const contract = getDepositoryContract();

  const response = await contract.methods.getBonds(account, isBondMatured).call();

  const { bondIds } = response;
  const allListPromise = [];
  const idsList = [];

  for (let i = 0; i < bondIds.length; i += 1) {
    const id = `${bondIds[i]}`;
    const result = contract.methods.getBondStatus(id).call();

    allListPromise.push(result);
    idsList.push(id);
  }

  const allListResponse = await Promise.all(allListPromise);
  const bondsListWithDetails = allListResponse.map((bond, index) => ({
    ...bond,
    bondId: idsList[index],
    key: idsList[index],
  }));

  /**
   * backend returns all the bonds if "isBondMatured = false",
   * hence we need to filter out if the bonds are matured or not
   */
  const filteredBonds = isBondMatured
    ? bondsListWithDetails
    : bondsListWithDetails.filter((bond) => !bond.matured);

  const bondsWithMaturityDate = await getBondInfoRequest(filteredBonds);
  return bondsWithMaturityDate;
};

export const getAllBondsRequest = async ({ account }) => {
  const maturedBonds = await getBondsRequest({ account, isActive: true });
  const nonMaturedBonds = await getBondsRequest({ account, isActive: false });
  return { maturedBonds, nonMaturedBonds };
};

export const redeemRequest = async ({ account, bondIds }) => {
  const contract = getDepositoryContract();
  const fn = contract.methods.redeem(bondIds).send({ from: account });
  const response = await sendTransaction(fn, account);
  return response?.transactionHash;
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
