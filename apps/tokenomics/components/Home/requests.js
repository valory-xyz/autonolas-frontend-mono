import { getDepositoryContract, sendTransaction } from 'common-util/functions';

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
export const getBondsRequest = async ({ account, isActive: isBondMatured }) => {
  const contract = getDepositoryContract();

  const response = await contract.methods
    .getBonds(account, isBondMatured)
    .call();

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
