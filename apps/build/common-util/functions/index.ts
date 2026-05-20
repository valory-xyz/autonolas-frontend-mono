import { RPC_URLS } from 'libs/util-constants/src';
import {
  getProvider as getProviderFn,
  getChainId as getChainIdFn,
  getChainIdOrDefaultToMainnet as getChainIdOrDefaultToMainnetFn,
  getIsValidChainId as getIsValidChainIdFn,
  sendTransaction as sendTransactionFn,
} from 'libs/util-functions/src';

import { SUPPORTED_CHAINS } from 'components/Login';

type ChainId = number | string;

export const getProvider = () => getProviderFn(SUPPORTED_CHAINS, RPC_URLS);

export const getIsValidChainId = (chainId: ChainId) =>
  getIsValidChainIdFn(SUPPORTED_CHAINS, chainId);

export const getChainIdOrDefaultToMainnet = (chainId: ChainId) =>
  getChainIdOrDefaultToMainnetFn(SUPPORTED_CHAINS, chainId);

export const getChainId = (chainId = null) => getChainIdFn(SUPPORTED_CHAINS, chainId);

type SendTransactionParameters = Parameters<typeof sendTransactionFn>;

export const sendTransaction = (
  fn: SendTransactionParameters[0],
  account: SendTransactionParameters[1],
) =>
  sendTransactionFn(fn, account, {
    supportedChains: SUPPORTED_CHAINS,
    rpcUrls: RPC_URLS,
  });
