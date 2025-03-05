import { readContract, readContracts } from '@wagmi/core';
import { ethers } from 'ethers';
import { Abi, AbiFunction, parseUnits } from 'viem';
import { Address } from 'viem';
import { mainnet } from 'viem/chains';

import {
  SERVICE_REGISTRY,
  STAKING_FACTORY,
  VE_OLAS,
} from 'libs/util-contracts/src/lib/abiAndAddresses';
import {
  getAddressFromBytes32,
  getEstimatedGasLimit,
  sendTransaction,
} from 'libs/util-functions/src';

import { SUPPORTED_CHAINS, wagmiConfig } from 'common-util/config/wagmi';

import { getUnixNextWeekStartTimestamp } from './time';
import {
  getGovernorContract,
  getOlasContract,
  getTokenomicsContract,
  getTreasuryContract,
  getVeOlasContract,
  getVoteWeightingContract,
} from './web3';
import { RPC_URLS } from 'libs/util-constants/src';

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

    // TODO: once verified contracts shouldn't be verified again;
    // the limits in Staking Verifier can change, but the contracts created before
    // that are still valid. We need to use
    // `stakingFactory.mapInstanceParams(instance).isEnabled`
    // instead
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
export const approveOlasByOwner = async ({
  account,
  amount,
}: {
  account: Address;
  amount: bigint;
}) => {
  try {
    const contract = getOlasContract();
    const spender = (VE_OLAS.addresses as Record<number, string>)[mainnet.id];
    const fn = contract.methods.approve(spender, amount).send({ from: account });

    const response = await sendTransaction(fn, account, {
      supportedChains: SUPPORTED_CHAINS,
      rpcUrls: RPC_URLS,
    });

    return response;
  } catch (error) {
    window.console.log('Error occurred on approving OLAS by owner');
    throw error;
  }
};

/**
 * Check if `Approve` button can be clicked; `allowance` should be greater than or equal to the amount
 */
export const hasSufficientTokensRequest = async ({
  account,
  amount,
}: {
  account: Address;
  amount: number;
}) => {
  try {
    const contract = getOlasContract();
    const spender = (VE_OLAS.addresses as Record<number, string>)[mainnet.id];

    const response = await contract.methods.allowance(account, spender).call();
    const responseInBg = ethers.toBigInt(response);

    // Resolve false if the response amount is zero
    if (responseInBg === ethers.toBigInt(0)) {
      return false;
    }

    const amountBN = parseUnits(`${amount}`, 18);

    // Check if the allowance is greater than or equal to the amount input
    return responseInBg >= amountBN;
  } catch (error) {
    window.console.log('Error occurred on calling `allowance` method');
    throw error;
  }
};

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

    return response?.transactionHash;
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

    return response?.transactionHash;
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

    return response?.transactionHash;
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

    return response?.transactionHash;
  } catch (error) {
    window.console.log('Error occurred on withdrawing veOlas');
    throw error;
  }
};

/**
 * Start new epoch
 */
export const checkpointRequest = async ({ account }: { account: Address }) => {
  const contract = getTokenomicsContract();
  try {
    const checkpointFn = contract.methods.checkpoint();
    const estimatedGas = await getEstimatedGasLimit(checkpointFn, account);
    const fn = checkpointFn.send({ from: account, gasLimit: estimatedGas });

    const response = await sendTransaction(fn, account, {
      supportedChains: SUPPORTED_CHAINS,
      rpcUrls: RPC_URLS,
    });

    return response?.transactionHash;
  } catch (error) {
    window.console.log('Error occurred on starting new epoch');
    throw error;
  }
};

/**
 * Check services are eligible for donating
 */
export const checkServicesTerminatedOrNotDeployed = async (ids: string[]) => {
  const invalidServiceIds: string[] = [];

  try {
    const response = await readContracts(wagmiConfig, {
      contracts: ids.map((id) => ({
        abi: SERVICE_REGISTRY.abi as Abi,
        address: (SERVICE_REGISTRY.addresses as Record<number, Address>)[mainnet.id],
        chainId: mainnet.id,
        functionName: 'getService',
        args: [id],
      })),
    });

    response.forEach((service, index) => {
      const serviceData = service.result as { state: number } | null;
      if (serviceData && serviceData.state !== 4 && serviceData.state !== 5) {
        invalidServiceIds.push(ids[index]);
      }
    });
  } catch (error) {
    window.console.log('Error on checking service status');
    throw error;
  }

  return invalidServiceIds;
};

/**
 * Donate to services
 */
export const depositServiceDonationRequest = async ({
  account,
  serviceIds,
  amounts,
  totalAmount,
}: {
  account: Address;
  serviceIds: string[];
  amounts: string[];
  totalAmount: string;
}) => {
  const contract = getTreasuryContract();

  try {
    const depositFn = contract.methods.depositServiceDonationsETH(serviceIds, amounts);
    const estimatedGas = await getEstimatedGasLimit(depositFn, account, totalAmount);
    const fn = depositFn.send({ from: account, value: totalAmount, gasLimit: estimatedGas });

    const response = await sendTransaction(fn, account, {
      supportedChains: SUPPORTED_CHAINS,
      rpcUrls: RPC_URLS,
    });

    return response?.transactionHash;
  } catch (error) {
    window.console.log('Error occurred on depositing service donation');
    throw error;
  }
};

/**
 * Vote for a proposal
 */
export const voteForProposal = async ({
  account,
  proposalId,
  support,
}: {
  account: Address;
  proposalId: string;
  support: number;
}) => {
  const contract = getGovernorContract();
  const voteFn = contract.methods.castVote(proposalId, support);

  const estimatedGas = await getEstimatedGasLimit(voteFn, account);
  const fn = voteFn.send({ from: account, estimatedGas });

  const result = await sendTransaction(fn, account, {
    supportedChains: SUPPORTED_CHAINS,
    rpcUrls: RPC_URLS,
  });

  return result;
};

/**
 * Revoke voting power from a removed nominee
 */
type RevokePowerParams = {
  account: Address | undefined;
  nominee: string;
  chainId: number;
};

export const revokePower = async ({ account, nominee, chainId }: RevokePowerParams) => {
  const contract = getVoteWeightingContract();
  const voteFn = contract.methods.revokeRemovedNomineeVotingPower(nominee, chainId);

  const estimatedGas = await getEstimatedGasLimit(voteFn, account);
  const fn = voteFn.send({ from: account, estimatedGas });

  const result = await sendTransaction(fn, account, {
    supportedChains: SUPPORTED_CHAINS,
    rpcUrls: RPC_URLS,
  });

  return result;
};
