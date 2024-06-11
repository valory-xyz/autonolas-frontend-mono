import { readContracts } from '@wagmi/core';
import { Contract } from 'ethers';
import { Address } from 'types/index';
import { AbiFunction } from 'viem';

import { STAKING_FACTORY } from 'libs/util-contracts/src/lib/abiAndAddresses';

import { wagmiConfig } from 'common-util/config/wagmi';

import { getAddressFromBytes32 } from './addresses';
import { getStartOfNextWeek } from './time';
import { getVeOlasContract, getVoteWeightingContract } from './web3';

const ESTIMATED_GAS_LIMIT = 500_000;

/**
 * function to estimate gas limit
 */
export const getEstimatedGasLimit = async (
  fn: Contract['methods'],
  account: Address | undefined,
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
  account: Address | undefined;
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
  const result = await contract.methods
    .voteForNomineeWeightsBatch(nominees, chainIds, weights)
    .send({ from: account });
  return result;
};

export const checkIfNomineeRemoved = async (allocations: { address: Address }[]) => {
  const contract = getVoteWeightingContract();
  const result: { account: Address; chainId: number }[] = await contract.methods
    .getAllRemovedNominees()
    .call();

  if (result) {
    const removedNominees = result.reduce((acc: Address[], removedNominee) => {
      if (allocations.findIndex((item) => item.address === removedNominee.account) !== -1) {
        acc.push(removedNominee.account);
      }
      return acc;
    }, []);

    return removedNominees;
  }

  return [];
};

export const checkIfContractDisabled = async (
  allocations: { address: Address; chainId: number }[],
) => {
  try {
    const result: Address[] = [];

    const response = await readContracts(wagmiConfig, {
      contracts: allocations.map((item) => ({
        address: (STAKING_FACTORY.addresses as Record<number, Address>)[item.chainId as number],
        abi: STAKING_FACTORY.abi as AbiFunction[],
        functionName: 'verifyInstance',
        args: [getAddressFromBytes32(item.address)],
        chainId: item.chainId,
      })),
    });

    response.forEach((response, index) => {
      if (response.status === 'success' && !response.result) {
        result.push(allocations[index].address);
      }
    });

    return result;
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const checkNegativeSlope = async (account: Address) => {
  const contract = getVeOlasContract();
  const result: { slope: string } = await contract.methods.getLastUserPoint(account).call();

  if (result) {
    return Number(result.slope) < 0;
  }

  return false;
};

export const checkLockExpired = async (account: Address) => {
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
