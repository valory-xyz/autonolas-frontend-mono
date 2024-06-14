import { readContracts } from '@wagmi/core';
import { AbiFunction } from 'viem';

import { sendTransaction } from '@autonolas/frontend-library';

import { STAKING_FACTORY } from 'libs/util-contracts/src/lib/abiAndAddresses';
import { getEstimatedGasLimit } from 'libs/util-functions/src';

import { SUPPORTED_CHAINS, wagmiConfig } from 'common-util/config/wagmi';
import { RPC_URLS } from 'common-util/constants/rpcs';
import { Address } from 'types/index';

import { getAddressFromBytes32 } from './addresses';
import { getStartOfNextWeekTimestamp } from './time';
import { getVeOlasContract, getVoteWeightingContract } from './web3';

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
  const voteFn = contract.methods.voteForNomineeWeightsBatch(nominees, chainIds, weights);

  const estimatedGas = await getEstimatedGasLimit(voteFn, account);
  const fn = voteFn.send({ from: account, estimatedGas });

  const result = await sendTransaction(fn, account, {
    supportedChains: SUPPORTED_CHAINS,
    rpcUrls: RPC_URLS,
  });

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
    const nextWeek = getStartOfNextWeekTimestamp();
    if (nextWeek >= result) {
      return true;
    }
  }

  return false;
};
