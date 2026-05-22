import {
  readContract,
  readContracts,
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from '@wagmi/core';
import { ethers } from 'ethers';
import { Abi, AbiFunction, Address, parseUnits } from 'viem';
import { mainnet } from 'viem/chains';

import {
  GOVERNOR_OLAS,
  OLAS,
  SERVICE_REGISTRY,
  STAKING_FACTORY,
  TOKENOMICS,
  TREASURY,
  VE_OLAS,
  VOTE_WEIGHTING,
} from 'libs/util-contracts/src/lib/abiAndAddresses';
import { getAddressFromBytes32 } from 'libs/util-functions/src';

import { wagmiConfig } from 'common-util/config/wagmi';
import { Nominee } from 'types';

import { getUnixNextWeekStartTimestamp } from './time';

// All governance contracts live on mainnet.
const MAINNET = mainnet.id;
// Widened version for wagmi simulate/write/wait overloads — the literal `1`
// doesn't satisfy the chain-tuple constraint in wagmi 2.19+, so each params
// bag passes `chainId: MAINNET_CHAIN_ID` instead of the literal mainnet.id.
const MAINNET_CHAIN_ID: number = mainnet.id;

const voteWeightingParams = {
  address: (VOTE_WEIGHTING.addresses as Record<number, Address>)[MAINNET],
  abi: VOTE_WEIGHTING.abi as Abi,
  chainId: MAINNET_CHAIN_ID,
};

const olasParams = {
  address: (OLAS.addresses as Record<number, Address>)[MAINNET],
  abi: OLAS.abi as Abi,
  chainId: MAINNET_CHAIN_ID,
};

const veOlasParams = {
  address: (VE_OLAS.addresses as Record<number, Address>)[MAINNET],
  abi: VE_OLAS.abi,
  chainId: MAINNET_CHAIN_ID,
};

const tokenomicsParams = {
  address: TOKENOMICS.addresses[MAINNET] as Address,
  abi: TOKENOMICS.abi as Abi,
  chainId: MAINNET_CHAIN_ID,
};

const treasuryParams = {
  address: TREASURY.addresses[MAINNET] as Address,
  abi: TREASURY.abi as Abi,
  chainId: MAINNET_CHAIN_ID,
};

const governorParams = {
  address: GOVERNOR_OLAS.addresses[MAINNET] as Address,
  abi: GOVERNOR_OLAS.abi as Abi,
  chainId: MAINNET_CHAIN_ID,
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
  const { request } = await simulateContract(wagmiConfig, {
    ...voteWeightingParams,
    functionName: 'voteForNomineeWeightsBatch',
    args: [nominees, chainIds, weights],
    account,
  });
  const hash = await writeContract(wagmiConfig, request);
  return waitForTransactionReceipt(wagmiConfig, { hash });
};

export const checkIfNomineeRemoved = async (allocations: { address: Address }[]) => {
  const result = (await readContract(wagmiConfig, {
    ...voteWeightingParams,
    functionName: 'getAllRemovedNominees',
  })) as Nominee[] | undefined;

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
    ...veOlasParams,
    functionName: 'getLastUserPoint',
    args: [account],
  });

  return result ? Number((result as { slope: string }).slope) < 0 : false;
};

export const checkLockExpired = async (account: Address) => {
  const result = await readContract(wagmiConfig, {
    ...veOlasParams,
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
    const spender = (VE_OLAS.addresses as Record<number, Address>)[MAINNET];
    const { request } = await simulateContract(wagmiConfig, {
      ...olasParams,
      functionName: 'approve',
      args: [spender, amount],
      account,
    });
    const hash = await writeContract(wagmiConfig, request);
    return waitForTransactionReceipt(wagmiConfig, { hash });
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
    const spender = (VE_OLAS.addresses as Record<number, Address>)[MAINNET];

    const response = await readContract(wagmiConfig, {
      ...olasParams,
      functionName: 'allowance',
      args: [account, spender],
    });
    const responseInBg = ethers.toBigInt(response as bigint | string);

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
  try {
    const { request } = await simulateContract(wagmiConfig, {
      ...veOlasParams,
      functionName: 'createLock',
      args: [amount, unlockTime],
      account,
    });
    const hash = await writeContract(wagmiConfig, request);
    const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
    return receipt.transactionHash;
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
  try {
    const { request } = await simulateContract(wagmiConfig, {
      ...veOlasParams,
      functionName: 'increaseAmount',
      args: [amount],
      account,
    });
    const hash = await writeContract(wagmiConfig, request);
    const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
    return receipt.transactionHash;
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
  try {
    const { request } = await simulateContract(wagmiConfig, {
      ...veOlasParams,
      functionName: 'increaseUnlockTime',
      args: [time],
      account,
    });
    const hash = await writeContract(wagmiConfig, request);
    const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
    return receipt.transactionHash;
  } catch (error) {
    window.console.log('Error occurred on increasing unlock time');
    throw error;
  }
};

/**
 * Withdraw VeOlas
 */
export const withdrawVeolasRequest = async ({ account }: { account: Address }) => {
  try {
    const { request } = await simulateContract(wagmiConfig, {
      ...veOlasParams,
      functionName: 'withdraw',
      account,
    });
    const hash = await writeContract(wagmiConfig, request);
    const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
    return receipt.transactionHash;
  } catch (error) {
    window.console.log('Error occurred on withdrawing veOlas');
    throw error;
  }
};

/**
 * Start new epoch
 */
export const checkpointRequest = async ({ account }: { account: Address }) => {
  try {
    const { request } = await simulateContract(wagmiConfig, {
      ...tokenomicsParams,
      functionName: 'checkpoint',
      account,
    });
    const hash = await writeContract(wagmiConfig, request);
    const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
    return receipt.transactionHash;
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
        address: (SERVICE_REGISTRY.addresses as Record<number, Address>)[MAINNET],
        chainId: MAINNET_CHAIN_ID,
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
  try {
    const { request } = await simulateContract(wagmiConfig, {
      ...treasuryParams,
      functionName: 'depositServiceDonationsETH',
      args: [serviceIds, amounts],
      account,
      value: BigInt(totalAmount),
    });
    const hash = await writeContract(wagmiConfig, request);
    const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
    return receipt.transactionHash;
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
  const { request } = await simulateContract(wagmiConfig, {
    ...governorParams,
    functionName: 'castVote',
    args: [proposalId, support],
    account,
  });
  const hash = await writeContract(wagmiConfig, request);
  return waitForTransactionReceipt(wagmiConfig, { hash });
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
  const { request } = await simulateContract(wagmiConfig, {
    ...voteWeightingParams,
    functionName: 'revokeRemovedNomineeVotingPower',
    args: [nominee, chainId],
    account,
  });
  const hash = await writeContract(wagmiConfig, request);
  return waitForTransactionReceipt(wagmiConfig, { hash });
};
