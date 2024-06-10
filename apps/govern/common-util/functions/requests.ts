import { Contract } from 'ethers';

import { getStartOfNextWeek } from './time';
import {
  executeBatchAsync,
  getStakingFactoryContract,
  getVeOlasContract,
  getVoteWeightingContract,
} from './web3';

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

export const checkIfNomineeRemoved = async (allocations: { address: `0x${string}` }[]) => {
  const contract = getVoteWeightingContract();
  const result: { account: `0x${string}`; chainId: number }[] = await contract.methods
    .getAllRemovedNominees()
    .call();

  if (result) {
    const removedNominees = result.reduce((acc: `0x${string}`[], removedNominee) => {
      if (allocations.findIndex((item) => item.address === removedNominee.account) !== -1) {
        acc.push(removedNominee.account);
      }
      return acc;
    }, []);

    return removedNominees;
  }

  return [];
};

type InstanceParams = {
  deployer: string;
  implementation: string;
  isEnabled: boolean;
};

export const checkIfContractDisabled = async (
  allocations: { address: `0x${string}`; chainId: number }[],
) => {
  try {
    const result: `0x${string}`[] = [];

    const calls = allocations.map((item) => {
      const contract = getStakingFactoryContract(item.chainId);
      // TODO: make '0x' + nominee.slice(-40) a function
      return contract.methods.mapInstanceParams('0x' + item.address.slice(-40)).call.request();
    });

    const batchResponse = (await executeBatchAsync(calls)) as InstanceParams[];

    batchResponse.forEach(({ isEnabled }, index) => {
      if (!isEnabled) result.push(allocations[index].address);
    });

    return result;
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const checkNegativeSlope = async (account: `0x${string}`) => {
  const contract = getVeOlasContract();
  const result: { slope: string } = await contract.methods.getLastUserPoint(account).call();

  if (result) {
    return Number(result.slope) < 0;
  }

  return false;
};

export const checkLockExpired = async (account: `0x${string}`) => {
  const contract = getVeOlasContract();
  const result: number = await contract.methods.lockedEnd(account).call();

  if (result) {
    const nextWeek = getStartOfNextWeek();
    if (nextWeek >= result) {
      return true;
    }
  }

  return false;
};
