import { Address } from 'viem';

import {
  HASH_PREFIX,
  getChainIdOrDefaultToMainnet as getChainIdOrDefaultToMainnetFn,
  getIsValidChainId as getIsValidChainIdFn,
  sendTransaction as sendTransactionFn,
} from '@autonolas/frontend-library';

import { ADDRESSES, RPC_URLS } from 'common-util/Contracts';
import { SUPPORTED_CHAINS } from 'common-util/login/config';
import { FIRST_SUPPORTED_CHAIN } from 'common-util/login/config';
import { Network } from 'types/index';
import { GATEWAY_URL, TOTAL_VIEW_COUNT } from 'util/constants';

export const getModalProvider = () => window?.MODAL_PROVIDER;

export const getWindowEthereum = () => window?.ethereum;

export const getProvider = () => {
  const defaultChainId = getChainId();
  const rpcUrl = typeof defaultChainId === 'number' ? RPC_URLS[defaultChainId] : null;

  if (!rpcUrl) {
    throw new Error(`No RPC URL found for chainId: ${defaultChainId}`);
  }

  if (typeof window === 'undefined') {
    /* eslint-disable-next-line no-console */
    console.warn('No provider found, fetching RPC URL from first supported chain');
    return rpcUrl;
  }

  // connected via wallet-connect
  const walletProvider = getModalProvider();
  if (walletProvider) {
    const walletConnectChainId = Number(walletProvider.chainId);

    // if logged in via wallet-connect but chainId is not supported,
    // default to mainnet (ie. Use JSON-RPC provider)
    return walletConnectChainId === defaultChainId ? walletProvider : rpcUrl;
  }

  // NOT logged in but has wallet installed (eg. Metamask).
  // If chainId is not supported, default to mainnet (ie. Use JSON-RPC provider)
  const windowEthereum = getWindowEthereum();
  if (windowEthereum?.chainId) {
    const walletChainId = Number(windowEthereum.chainId);

    return walletChainId === defaultChainId ? windowEthereum : rpcUrl;
  }

  // fallback to mainnet JSON RPC provider
  return rpcUrl;
};

export const getIsValidChainId = (chainId: number): chainId is Network =>
  getIsValidChainIdFn(SUPPORTED_CHAINS, chainId);

export const getChainIdOrDefaultToFirstSupportedChain = (chainId = FIRST_SUPPORTED_CHAIN.id) => {
  const x = getChainIdOrDefaultToMainnetFn(SUPPORTED_CHAINS, chainId);
  return x;
};

export const getChainId = (chainId = null): Network => {
  if (chainId) return chainId;

  // chainId fetched from sessionStorage
  const chainIdFromSessionStorage =
    sessionStorage && sessionStorage.getItem('chainId')
      ? Number(sessionStorage.getItem('chainId'))
      : FIRST_SUPPORTED_CHAIN.id;

  // if chainId is not supported, throw error
  if (!SUPPORTED_CHAINS.find((e) => e.id === chainIdFromSessionStorage)) {
    throw new Error('Invalid chain id');
  }

  return (chainIdFromSessionStorage || FIRST_SUPPORTED_CHAIN.id) as Network;
};

// eslint-disable-next-line
export const sendTransaction = (fn: any, account: Address) =>
  sendTransactionFn(fn, account, {
    supportedChains: SUPPORTED_CHAINS,
    rpcUrls: RPC_URLS,
  });

/**
 * @example
 * TOTAL_VIEW_COUNT = 10
 * nextPage = 5
 * total = 45
 * first = ((5 - 1) * 10) + 1
 *      = (4 * 10) + 1
 *      = 41
 * last = min(5 * 10, 45)
 *      = 45
 */
export const getFirstAndLastIndex = (total: number, nextPage: number) => {
  let first = 1;
  if (nextPage !== 1) {
    first = (nextPage - 1) * TOTAL_VIEW_COUNT + 1;
  }
  const last = Math.min(nextPage * TOTAL_VIEW_COUNT, total);
  return { first, last };
};

export const getSupportedNetworks = () => Object.keys(ADDRESSES).map((e) => Number(e));

export const getIpfsResponse = async (hash: string) => {
  try {
    const ipfsUrl = `${GATEWAY_URL}${HASH_PREFIX}${hash.substring(2)}`;
    const response = await fetch(ipfsUrl);
    const json = await response.json();
    return json;
  } catch (e) {
    window.console.error('Error fetching metadata from IPFS', e);
    throw new Error((e as Error)?.message);
  }
};

// show last element of agentHashes array
export const getAgentHash = (agentHashes: string[] = []) =>
  agentHashes.length === 0 ? '' : agentHashes[agentHashes.length - 1];
