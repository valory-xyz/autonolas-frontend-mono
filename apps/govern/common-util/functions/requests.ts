import { readContract, readContracts } from '@wagmi/core';
import { AbiFunction } from 'viem';
import { Address } from 'viem';
import { mainnet } from 'viem/chains';

import { sendTransaction } from '@autonolas/frontend-library';

import { STAKING_FACTORY, VE_OLAS } from 'libs/util-contracts/src/lib/abiAndAddresses';
import { getEstimatedGasLimit } from 'libs/util-functions/src';

import { SUPPORTED_CHAINS, wagmiConfig } from 'common-util/config/wagmi';
import { RPC_URLS } from 'common-util/constants/rpcs';

import { getAddressFromBytes32 } from './addresses';
import { getUnixNextWeekStartTimestamp } from './time';
import { getVoteWeightingContract } from './web3';

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

  if (!result) return [];

  const removedNominees = result.reduce((acc: Address[], removedNominee) => {
    if (allocations.findIndex((item) => item.address === removedNominee.account) !== -1) {
      acc.push(removedNominee.account);
    }
    return acc;
  }, []);

  return removedNominees;
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
    console.error(error);
    return [];
  }
};

export const checkNegativeSlope = async (account: Address) => {
  const result = await readContract(wagmiConfig, {
    abi: VE_OLAS.abi,
    address: (VE_OLAS.addresses as Record<number, Address>)[mainnet.id],
    chainId: mainnet.id,
    functionName: 'getLastUserPoint',
    args: [account],
  });

  return result ? Number((result as { slope: string }).slope) < 0 : false;
};

export const checkLockExpired = async (account: Address) => {
  const result = await readContract(wagmiConfig, {
    abi: VE_OLAS.abi,
    address: (VE_OLAS.addresses as Record<number, Address>)[mainnet.id],
    chainId: mainnet.id,
    functionName: 'lockedEnd',
    args: [account],
  });

  const nextWeek = getUnixNextWeekStartTimestamp();

  return result ? nextWeek >= (result as number) : false;
};
