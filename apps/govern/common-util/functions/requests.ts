import { readContract, readContracts } from '@wagmi/core';
import { ethers } from 'ethers';
import { AbiFunction, TransactionReceipt } from 'viem';
import { Address } from 'viem';
import { mainnet } from 'viem/chains';

import { sendTransaction } from '@autonolas/frontend-library';

import { STAKING_FACTORY, VE_OLAS } from 'libs/util-contracts/src/lib/abiAndAddresses';
import { getEstimatedGasLimit } from 'libs/util-functions/src';

import { SUPPORTED_CHAINS, wagmiConfig } from 'common-util/config/wagmi';
import { RPC_URLS } from 'common-util/constants/rpcs';

import { getAddressFromBytes32 } from './addresses';
import { getUnixNextWeekStartTimestamp } from './time';
import { getOlasContract, getVeOlasContract, getVoteWeightingContract } from './web3';

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

/**
 * Approve amount of OLAS to be used
 */
export const approveOlasByOwner = ({ account, amount }: { account: Address; amount: bigint }) =>
  new Promise((resolve, reject) => {
    const contract = getOlasContract();
    const spender = (VE_OLAS.addresses as Record<number, string>)[mainnet.id];
    const fn = contract.methods.approve(spender, amount).send({ from: account });

    sendTransaction(fn, account, {
      supportedChains: SUPPORTED_CHAINS,
      rpcUrls: RPC_URLS,
    })
      .then((response) => {
        resolve(response);
      })
      .catch((e) => {
        window.console.log('Error occurred on approving OLAS by owner');
        reject(e);
      });
  });

/**
 * Check if `Approve` button can be clicked; `allowance` should be greater than or equal to the amount
 */
export const hasSufficientTokensRequest = ({
  account,
  amount,
}: {
  account: Address;
  amount: number;
}) =>
  new Promise((resolve, reject) => {
    const contract = getOlasContract();
    const spender = (VE_OLAS.addresses as Record<number, string>)[mainnet.id];

    contract.methods
      .allowance(account, spender)
      .call()
      .then((response: bigint) => {
        const responseInBg = ethers.toBigInt(response);

        // Resolve false if the response amount is zero
        if (responseInBg === ethers.toBigInt(0)) {
          resolve(false);
          return;
        }

        const amountBN = ethers.parseUnits(`${amount}`);

        // check if the allowance is greater than or equal to the amount input
        resolve(responseInBg >= amountBN);
      })
      .catch((e: Error) => {
        window.console.log('Error occurred on calling `allowance` method');
        reject(e);
      });
  });

/**
 * Create lock for veOLAS
 */
export const createLockRequest = async ({
  account,
  amount,
  unlockTime,
}: {
  account: Address;
  amount: string;
  unlockTime: number;
}) => {
  const contract = getVeOlasContract();

  try {
    const createLockFn = contract.methods.createLock(amount, unlockTime);
    const estimatedGas = await getEstimatedGasLimit(createLockFn, account);
    const fn = createLockFn.send({ from: account, gasLimit: estimatedGas });

    const response = await sendTransaction(fn, account, {
      supportedChains: SUPPORTED_CHAINS,
      rpcUrls: RPC_URLS,
    });

    return (response as TransactionReceipt)?.transactionHash;
  } catch (error) {
    window.console.log('Error occurred on creating lock for veOLAS');
    throw error;
  }
};

/**
 * Increase Olas amount locked without modifying the lock time
 */
export const updateIncreaseAmount = async ({
  account,
  amount,
}: {
  account: Address;
  amount: string;
}) => {
  const contract = getVeOlasContract();

  try {
    const increaseAmountFn = contract.methods.increaseAmount(amount);
    const estimatedGas = await getEstimatedGasLimit(increaseAmountFn, account);
    const fn = increaseAmountFn.send({ from: account, gasLimit: estimatedGas });

    const response = await sendTransaction(fn, account, {
      supportedChains: SUPPORTED_CHAINS,
      rpcUrls: RPC_URLS,
    });

    return (response as TransactionReceipt)?.transactionHash;
  } catch (e) {
    window.console.log('Error occurred on increasing amount with estimated gas');
    throw e;
  }
};

/**
 * Increase the unlock time without modifying the amount
 */
export const updateIncreaseUnlockTime = async ({
  account,
  time,
}: {
  account: Address;
  time: number;
}) => {
  const contract = getVeOlasContract();

  try {
    const increaseUnlockTimeFn = contract.methods.increaseUnlockTime(time);
    const estimatedGas = await getEstimatedGasLimit(increaseUnlockTimeFn, account);
    const fn = increaseUnlockTimeFn.send({
      from: account,
      gasLimit: estimatedGas,
    });

    const response = await sendTransaction(fn, account, {
      supportedChains: SUPPORTED_CHAINS,
      rpcUrls: RPC_URLS,
    });

    return (response as TransactionReceipt)?.transactionHash;
  } catch (error) {
    window.console.log('Error occurred on increasing unlock time');
    throw error;
  }
};

/**
 * Withdraw VeOlas
 */
export const withdrawVeolasRequest = async ({ account }: { account: Address }) => {
  const contract = getVeOlasContract();

  try {
    const withdrawFn = contract.methods.withdraw();
    const estimatedGas = await getEstimatedGasLimit(withdrawFn, account);
    const fn = withdrawFn.send({ from: account, gasLimit: estimatedGas });

    const response = await sendTransaction(fn, account, {
      supportedChains: SUPPORTED_CHAINS,
      rpcUrls: RPC_URLS,
    });

    return (response as TransactionReceipt)?.transactionHash;
  } catch (error) {
    window.console.log('Error occurred on withdrawing veOlas');
    throw error;
  }
};
