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

export enum Feature {
  CREATE = 'create',
  NOMINATE = 'nominate',
}

const METAMASK_ERRORS = {
  create: [
    {
      code: 4001,
      name: '',
      message: 'Transaction rejected by user. The contract hasn’t been created.',
    },
  ],
  nominate: [
    {
      code: 4001,
      name: 'Transaction rejected by user',
      message: 'Transaction rejected by user. The contract can’t be nominated.',
    },
  ],
};

const EVM_ERRORS = {
  create: [
    {
      errorText: 'Transaction has been reverted by the EVM',
      name: '',
      displayText: 'Transaction failed. The contract hasn’t been created.',
    },
  ],
  nominate: [
    {
      errorText: 'Transaction has been reverted by the EVM',
      name: 'Transaction failed',
      displayText: 'Transaction failed. The contract can’t be nominated.',
    },
  ],
};

export const getErrorInfo = (type: Feature, error: Error | { code: number; message: string }) => {
  const defaultMessage = 'Some error occurred. Please try again';

  let name;
  let message = defaultMessage;
  let transactionHash;

  if ('code' in error) {
    const foundMetamaskError = METAMASK_ERRORS[type].find((item) => item.code === error.code);
    if (foundMetamaskError) {
      name = foundMetamaskError.name;
      message = foundMetamaskError.message;
    }
  }

  if ('message' in error) {
    const foundError = EVM_ERRORS[type].find((item) => error.message === item.errorText);
    if (foundError) {
      name = foundError.name;
      message = foundError.displayText;
    }
  }

  if ('receipt' in error) {
    transactionHash = (error.receipt as TransactionReceipt).transactionHash as Address;
  }

  return { name, message, transactionHash };
};
