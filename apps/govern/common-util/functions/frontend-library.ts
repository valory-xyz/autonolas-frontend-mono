import {
  getChainId as getChainIdFn,
  getProvider as getProviderFn,
} from 'libs/util-functions/src/lib/sendTransaction/helpers';
import { notifyError } from 'libs/util-functions/src';

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
