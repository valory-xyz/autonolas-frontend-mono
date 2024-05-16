import { Contract, ethers } from 'ethers';

import { executeBatchAsync, getVoteWeightingContract } from './web3';

const ESTIMATED_GAS_LIMIT = 500_000;

/**
 * function to estimate gas limit
 */
export const getEstimatedGasLimit = async (
  fn: Contract['methods'],
  account: `0x${string}` | undefined,
) => {
  if (!account) {
    throw new Error('Invalid account passed to estimate gas limit');
  }

  try {
    const estimatedGas = await fn.estimateGas({ from: account });
    return Math.ceil(Number(estimatedGas) * 1.2);
  } catch (error) {
    window.console.warn(`Error occurred on estimating gas, defaulting to ${ESTIMATED_GAS_LIMIT}`);
  }

  return ESTIMATED_GAS_LIMIT;
};

/**
 * Get the list of all nominated for voting staking contracts
 */

export const getAllNominees = async () => {
  const contract = getVoteWeightingContract();
  const result: string[] = await contract.methods.getAllNominees().call();
  // returned set includes the zero-th empty nominee instance, remove it
  return result.filter((item) => item[0] !== ethers.zeroPadValue(ethers.ZeroAddress, 32));
};

/**
 * Get all aggregated weights of the staking contracts
 */
export type GetNomineesWeightsParams = { nominees: string[]; time: number };
type GetNomineesWeightResponse = { weight: string; totalSum: string };

export const getNomineesWeights = async ({ nominees, time }: GetNomineesWeightsParams) => {
  try {
    const result: Record<string, GetNomineesWeightResponse> = {};
    const contract = getVoteWeightingContract();
    const calls = nominees.map((nominee) =>
      contract.methods.nomineeRelativeWeight(nominee[0], nominee[1], time).call.request(),
    );
    const batchResponse = (await executeBatchAsync(calls)) as GetNomineesWeightResponse[];

    batchResponse.forEach(({ weight, totalSum }, index) => {
      result[nominees[index][0]] = { weight, totalSum };
    });

    return result;
  } catch (error) {
    console.log(error);
    return {};
  }
};

/**
 * Get all current vote slopes of the user
 */

export type GetUserSlopeParams = { account: string; nominees: string[] };
type GetUserSlopeResponse = { slope: string; power: string; end: string };

export const getUserSlopes = async ({ account, nominees }: GetUserSlopeParams) => {
  try {
    const result: Record<string, GetUserSlopeResponse> = {};
    const contract = getVoteWeightingContract();
    const calls = nominees.map((nominee) =>
      contract.methods.voteUserSlopes(account, nominee).call.request(),
    );
    const batchResponse = (await executeBatchAsync(calls)) as GetUserSlopeResponse[];

    batchResponse.forEach(({ slope, power, end }, index) => {
      result[nominees[index][0]] = { slope, power, end };
    });

    return result;
  } catch (error) {
    console.log(error);
    return {};
  }
};

/**
 *
 */
type VoteForNomineeWeightsParams = {
  account: `0x${string}` | undefined;
  nominees: string[];
  chainIds: string[];
  weights: string[];
};
export const voteForNomineeWeights = async ({
  account,
  nominees,
  chainIds,
  weights,
}: VoteForNomineeWeightsParams) => {
  const contract = getVoteWeightingContract();
  // TODO: sort by weights asc
  const result = await contract.methods
    .voteForNomineeWeightsBatch(nominees, chainIds, weights)
    .send({ from: account });
  return result;
};
