import { Contract } from 'ethers';

import { getVoteWeightingContract } from './web3';

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

type VoteForNomineeWeightsParams = {
  account: `0x${string}` | undefined;
  nominees: string[];
  chainIds: number[];
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
