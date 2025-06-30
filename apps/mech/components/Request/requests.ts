import { getChainId, readContract, writeContract } from '@wagmi/core';
import { Address } from 'viem';

import { MECH_MARKETPLACE_ABI } from 'common-util/AbiAndAddresses';
import { BALANCE_TRACKER_FIXED_PRICE_TOKEN_ABI } from 'common-util/AbiAndAddresses';
import { ADDRESSES } from 'common-util/Contracts';
import { wagmiConfig } from 'common-util/Login/config';
import { getIsValidChainId } from 'common-util/functions';

export const getBalanceTrackerContract = async (paymentType: `0x${string}`) => {
  try {
    const chainId = getChainId(wagmiConfig);
    if (!getIsValidChainId(chainId)) {
      throw new Error('Unsupported chain');
    }

    const balanceTrackerContract = await readContract(wagmiConfig, {
      address: ADDRESSES[chainId].mechMarketplace,
      abi: MECH_MARKETPLACE_ABI,
      functionName: 'mapPaymentTypeBalanceTrackers',
      args: [paymentType],
    });

    return balanceTrackerContract;
  } catch (error) {
    console.error(`Error getting balance tracker contract by payment type: ${paymentType}`, error);
    throw error;
  }
};

export const getBalanceTrackerToken = async (address: Address) => {
  try {
    const token = await readContract(wagmiConfig, {
      address,
      abi: BALANCE_TRACKER_FIXED_PRICE_TOKEN_ABI,
      functionName: 'token',
    });

    return token;
  } catch (error) {
    console.error(`Error getting token from balance tracker contract: ${address}`, error);
    throw error;
  }
};

type SendMarketplaceRequestArgs = {
  requestData: `0x${string}`;
  maxDeliveryRate: bigint;
  paymentType: `0x${string}`;
  priorityMech: Address;
  responseTimeout: bigint;
  paymentData: `0x${string}`;
  isNVM: boolean;
};

export const sendMarketplaceRequest = async ({
  requestData,
  maxDeliveryRate,
  paymentType,
  priorityMech,
  responseTimeout,
  paymentData,
  isNVM,
}: SendMarketplaceRequestArgs) => {
  try {
    const chainId = getChainId(wagmiConfig);
    if (!getIsValidChainId(chainId)) {
      throw new Error('Unsupported chain');
    }

    let value: undefined | bigint = maxDeliveryRate;

    if (isNVM) {
      // Deposit is not allowed for NVM
      value = undefined;
    }

    const hash = await writeContract(wagmiConfig, {
      address: ADDRESSES[chainId].mechMarketplace,
      abi: MECH_MARKETPLACE_ABI,
      functionName: 'request',
      chainId,
      args: [requestData, maxDeliveryRate, paymentType, priorityMech, responseTimeout, paymentData],
      value,
    });

    return hash;
  } catch (error) {
    console.error('Error sending request', error);
    throw new Error('Error sending request');
  }
};
