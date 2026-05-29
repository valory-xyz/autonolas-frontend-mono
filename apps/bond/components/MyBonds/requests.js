import {
  readContract,
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from '@wagmi/core';

import { wagmiConfig } from 'common-util/config/wagmi';
import { depositoryParams } from 'common-util/Contracts/params';
import { getChainId } from 'common-util/functions/frontend-library';

export const getBondInfoRequest = async (bondList) => {
  const chainId = getChainId();

  try {
    const lpTokenNameList = await Promise.all(
      bondList.map((bond) =>
        readContract(wagmiConfig, {
          ...depositoryParams(chainId),
          functionName: 'mapUserBonds',
          args: [bond.bondId],
        }),
      ),
    );

    return bondList.map((component, index) => {
      // mapUserBonds returns (account, payout, maturity, productId) as a tuple;
      // viem decodes multi-output reads positionally, not as a named object.
      const [, , maturity] = lpTokenNameList[index];
      return { ...component, maturityDate: Number(maturity) * 1000 };
    });
  } catch (error) {
    window.console.log('Error on fetching bond info');
    return bondList;
  }
};

const getBondsRequest = async ({ account, isActive: isBondMatured }) => {
  const chainId = getChainId();

  const response = await readContract(wagmiConfig, {
    ...depositoryParams(chainId),
    functionName: 'getBonds',
    args: [account, isBondMatured],
  });

  const [bondIds] = response;
  const idsList = bondIds.map((id) => `${id}`);

  const allListResponse = await Promise.all(
    idsList.map((id) =>
      readContract(wagmiConfig, {
        ...depositoryParams(chainId),
        functionName: 'getBondStatus',
        args: [id],
      }),
    ),
  );

  const bondsListWithDetails = allListResponse.map(([payout, matured], index) => ({
    payout,
    matured,
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
  const chainId = getChainId();
  const { request } = await simulateContract(wagmiConfig, {
    ...depositoryParams(chainId),
    functionName: 'redeem',
    args: [bondIds],
    account,
  });
  const hash = await writeContract(wagmiConfig, request);
  const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
  return receipt.transactionHash;
};
