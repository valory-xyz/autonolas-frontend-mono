import {
  getProvider as getProviderFn,
  getChainId as getChainIdFn,
  getChainIdOrDefaultToMainnet as getChainIdOrDefaultToMainnetFn,
  sendTransaction as sendTransactionFn,
  LOCAL_FORK_ID,
  notifyError,
} from '@autonolas/frontend-library';

import { RPC_URLS } from 'common-util/constants/rpcs';
import { SUPPORTED_CHAINS } from 'common-util/config/wagmi';

const supportedChains =
  process.env.NEXT_PUBLIC_IS_CONNECTED_TO_LOCAL === 'true'
    ? [...SUPPORTED_CHAINS, { id: LOCAL_FORK_ID }]
    : SUPPORTED_CHAINS;

export const getProvider = () => {
  const provider = getProviderFn(supportedChains, RPC_URLS);
  // not connected, return fallback URL
  if (typeof provider === 'string') return provider;
  // coinbase injected multiwallet provider
  if (provider?.selectedProvider) return provider.selectedProvider;
  if (provider?.providerMap?.get('CoinbaseWallet'))
    return provider.providerMap.get('CoinbaseWallet');
  // standard provider
  if (provider) return provider;
  return notifyError('Provider not found');
};

export const getChainIdOrDefaultToMainnet = (chainId) =>
  getChainIdOrDefaultToMainnetFn(supportedChains, chainId);

export const getChainId = (chainId) => {
  if (process.env.NEXT_PUBLIC_IS_CONNECTED_TO_LOCAL === 'true') {
    return LOCAL_FORK_ID;
  }
  return getChainIdFn(supportedChains, chainId);
};

export const sendTransaction = (fn, account) =>
  sendTransactionFn(fn, account, {
    supportedChains,
    rpcUrls: RPC_URLS,
  });
