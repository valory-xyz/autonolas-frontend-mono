import {
  notifyError,
  getProvider as getProviderFn,
  getChainId as getChainIdFn,
  getChainIdOrDefaultToMainnet as getChainIdOrDefaultToMainnetFn,
  sendTransaction as sendTransactionFn,
} from 'libs/util-functions/src';

import { RPC_URLS } from 'common-util/constants/rpcs';
import { SUPPORTED_CHAINS } from 'common-util/config/wagmi';

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

export const getChainIdOrDefaultToMainnet = (chainId) =>
  getChainIdOrDefaultToMainnetFn(SUPPORTED_CHAINS, chainId);

export const getChainId = (chainId) => {
  return getChainIdFn(SUPPORTED_CHAINS, chainId);
};

export const sendTransaction = (fn, account) =>
  sendTransactionFn(fn, account, { supportedChains: SUPPORTED_CHAINS, rpcUrls: RPC_URLS });
