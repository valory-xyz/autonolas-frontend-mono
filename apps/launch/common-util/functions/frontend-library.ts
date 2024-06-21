import { Address, TransactionReceipt } from 'viem';

import {
  getChainId as getChainIdFn,
  getProvider as getProviderFn,
  notifyError,
} from '@autonolas/frontend-library';

import { notifyWarning } from 'libs/util-functions/src';

import { SUPPORTED_CHAINS } from 'common-util/config/wagmi';
import { LAUNCH_RPC_URLS } from 'common-util/constants/rpcs';

export const getProvider = () => {
  const provider = getProviderFn(SUPPORTED_CHAINS, LAUNCH_RPC_URLS);
  // not connected, return fallback URL
  if (typeof provider === 'string') return provider;
  // coinbase injected multi wallet provider
  if (provider?.selectedProvider) return provider.selectedProvider;
  if (provider?.providerMap?.get('CoinbaseWallet'))
    return provider.providerMap.get('CoinbaseWallet');
  // standard provider
  if (provider) return provider;
  return notifyError('Provider not found');
};

export const getChainId = (chainId?: number) => {
  return getChainIdFn(SUPPORTED_CHAINS, chainId || '');
};

export const notifyWrongNetwork = () => {
  notifyWarning('Please switch to the correct network and try again');
};

export const notifyConnectWallet = () => {
  notifyWarning('Please connect your wallet');
};

type FeatureType = 'create' | 'nominate';

const METAMASK_ERRORS: Record<FeatureType, Record<number, string>> = {
  create: {
    4001: 'Transaction rejected by user. The contract hasn’t been created.',
  },
  nominate: {
    4001: 'Transaction rejected by user. The contract can’t be nominated.',
  },
};

const EVM_ERRORS = {
  create: [
    {
      errorText: 'Transaction has been reverted by the EVM',
      displayText: 'Transaction failed. The contract hasn’t been created.',
    },
  ],
  nominate: [
    {
      errorText: 'Transaction has been reverted by the EVM',
      displayText: 'Transaction failed. The contract can’t be nominated.',
    },
  ],
};

export const getErrorInfo = (
  type: FeatureType,
  error: Error | { code: number; message: string },
) => {
  const defaultMessage = 'Some error occurred. Please try again';

  let message = defaultMessage;
  let transactionHash;

  if ('code' in error && METAMASK_ERRORS[type][error.code]) {
    message = METAMASK_ERRORS[type][error.code];
  }

  if ('message' in error) {
    const foundError = EVM_ERRORS[type].find(
      (item) => error.message.indexOf(item.errorText) !== -1,
    );
    if (foundError) {
      message = foundError.displayText;
    }
  }

  if ('receipt' in error) {
    transactionHash = (error.receipt as TransactionReceipt).transactionHash as Address;
  }

  return { message, transactionHash };
};
