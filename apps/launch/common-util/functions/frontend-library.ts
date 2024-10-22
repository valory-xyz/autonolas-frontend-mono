import { Address, TransactionReceipt } from 'viem';

import {
  getChainId as getChainIdFn,
  getProvider as getProviderFn,
  notifyError,
} from '@autonolas/frontend-library';

import { SUPPORTED_CHAINS } from 'common-util/config/wagmi';
import { RPC_URLS } from 'libs/util-constants/src';

export const getProvider = () => {
  const provider = getProviderFn(SUPPORTED_CHAINS, RPC_URLS);
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
      message: 'Transaction rejected by user. The contract hasn’t been nominated',
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
      displayText: 'Transaction failed. The contract hasn’t been nominated',
    },
  ],
};

export const getErrorInfo = (type: Feature, error: Error | { code: number; message: string }) => {
  const defaultMessage = 'Some error occurred. Please try again';

  let name;
  let message = defaultMessage;
  let transactionHash;

  if ('code' in error) {
    const metamaskError = METAMASK_ERRORS[type].find((item) => item.code === error.code);
    if (metamaskError) {
      name = metamaskError.name;
      message = metamaskError.message;
    }
  }

  if ('message' in error) {
    const evmError = EVM_ERRORS[type].find((item) => error.message === item.errorText);
    if (evmError) {
      name = evmError.name;
      message = evmError.displayText;
    }
  }

  if ('receipt' in error) {
    transactionHash = (error.receipt as TransactionReceipt).transactionHash as Address;
  }

  return { name, message, transactionHash };
};
