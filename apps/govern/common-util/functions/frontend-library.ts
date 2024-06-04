import { base, gnosis, goerli, mainnet, optimism, polygon } from 'viem/chains';

import {
  getChainId as getChainIdFn,
  getProvider as getProviderFn,
  notifyError,
} from '@autonolas/frontend-library';

import { SUPPORTED_CHAINS } from 'common-util/config/wagmi';
import { RPC_URLS } from 'common-util/constants/rpcs';

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

export const CHAIN_NAMES: Record<string, string> = {
  1: mainnet.name,
  5: goerli.name,
  10: optimism.name,
  100: gnosis.name,
  137: polygon.name,
  31337: 'Hardhat Local',
  8453: base.name,
};
