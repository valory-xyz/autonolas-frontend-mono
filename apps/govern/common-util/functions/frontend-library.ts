import { base, gnosis, goerli, mainnet, optimism, polygon } from 'viem/chains';

import {
  STAGING_CHAIN_ID,
  getChainId as getChainIdFn,
  getProvider as getProviderFn,
  notifyError,
} from '@autonolas/frontend-library';

import { SUPPORTED_CHAINS } from 'common-util/config/wagmi';
import { RPC_URLS } from 'common-util/constants/rpcs';

const supportedChains =
  process.env.NEXT_PUBLIC_IS_CONNECTED_TO_LOCAL === 'true'
    ? [...SUPPORTED_CHAINS, { id: STAGING_CHAIN_ID }]
    : SUPPORTED_CHAINS;

export const getProvider = () => {
  const provider = getProviderFn(supportedChains, RPC_URLS);
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
  if (process.env.NEXT_PUBLIC_IS_CONNECTED_TO_LOCAL === 'true') {
    return STAGING_CHAIN_ID;
  }
  return getChainIdFn(supportedChains, chainId || '');
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
