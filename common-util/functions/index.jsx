import { GATEWAY_URL, TOTAL_VIEW_COUNT } from 'util/constants';
import { ADDRESSES, rpc } from 'common-util/Contracts';
import {
  getProvider as getProviderFn,
  getChainId as getChainIdFn,
  getChainIdOrDefaultToMainnet as getChainIdOrDefaultToMainnetFn,
  getIsValidChainId as getIsValidChainIdFn,
  sendTransaction as sendTransactionFn,
} from '@autonolas/frontend-library';
import { SUPPORTED_CHAINS } from 'common-util/Login';

export const getProvider = () => getProviderFn(SUPPORTED_CHAINS, rpc);

export const getIsValidChainId = (chainId) => getIsValidChainIdFn(SUPPORTED_CHAINS, chainId);

export const getChainIdOrDefaultToMainnet = (chainId) => {
  const x = getChainIdOrDefaultToMainnetFn(SUPPORTED_CHAINS, chainId);
  return x;
};

export const getChainId = (chainId = null) => getChainIdFn(SUPPORTED_CHAINS, chainId);

export const sendTransaction = (fn, account) => sendTransactionFn(fn, account, {
  supportedChains: SUPPORTED_CHAINS,
  rpcUrls: rpc,
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
export const getFirstAndLastIndex = (total, nextPage) => {
  let first = 1;
  if (nextPage !== 1) {
    first = (nextPage - 1) * TOTAL_VIEW_COUNT + 1;
  }
  const last = Math.min(nextPage * TOTAL_VIEW_COUNT, total);
  return { first, last };
};

export const getSupportedNetworks = () => Object.keys(ADDRESSES).map((e) => Number(e));

export const getIpfsResponse = async (hash) => {
  try {
    const ipfsUrl = `${GATEWAY_URL}f01701220${hash.substring(2)}`;
    const response = await fetch(ipfsUrl);
    const json = await response.json();
    return json;
  } catch (e) {
    window.console.error('Error fetching metadata from IPFS', e);
    throw new Error(e);
  }
};

// show last element of agentHashes array
export const getAgentHash = (agentHashes = []) => (agentHashes.length === 0 ? '' : agentHashes[agentHashes.length - 1]);
