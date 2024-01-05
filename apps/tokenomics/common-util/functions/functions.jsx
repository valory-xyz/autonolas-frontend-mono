/* eslint-disable max-len */
import { ethers } from 'ethers';
import { isObject } from 'lodash';
import {
  notifyError,
  getProvider as getProviderFn,
  getEthersProvider as getEthersProviderFn,
  getChainId as getChainIdFn,
  getChainIdOrDefaultToMainnet as getChainIdOrDefaultToMainnetFn,
  getIsValidChainId as getIsValidChainIdFn,
  sendTransaction as sendTransactionFn,
  LOCAL_FORK_ID,
} from '@autonolas/frontend-library';

import { RPC_URLS } from 'common-util/Contracts';
import { SUPPORTED_CHAINS } from 'common-util/Login';

const getSupportedChains = () => (process.env.NEXT_PUBLIC_IS_CONNECTED_TO_LOCAL === 'true'
  ? [...SUPPORTED_CHAINS, { id: LOCAL_FORK_ID }]
  : SUPPORTED_CHAINS);

/**
 * re-usable functions
 */

export const getProvider = () => getProviderFn(getSupportedChains(), RPC_URLS);

export const getEthersProvider = () => getEthersProviderFn(getSupportedChains(), RPC_URLS);

export const getIsValidChainId = (chainId) => getIsValidChainIdFn(getSupportedChains(), chainId);

export const getChainIdOrDefaultToMainnet = (chainId) => getChainIdOrDefaultToMainnetFn(getSupportedChains(), chainId);

export const getChainId = (chainId = null) => {
  if (process.env.NEXT_PUBLIC_IS_CONNECTED_TO_LOCAL === 'true') {
    return LOCAL_FORK_ID;
  }
  return getChainIdFn(getSupportedChains(), chainId);
};

export const sendTransaction = (fn, account) => sendTransactionFn(fn, account, {
  supportedChains: getSupportedChains(),
  rpcUrls: RPC_URLS,
});

/**
 * https://docs.ethers.org/v5/api/utils/constants/#constants-MaxUint256
 */
export const MAX_AMOUNT = ethers.constants.MaxUint256;

export const ADDRESS_ZERO = ethers.constants.AddressZero;

export const ONE_ETH = ethers.constants.WeiPerEther;

/**
 * Same as `formatToEth` but doesn't fixes the decimal to 8
 * @returns {String} eg: 1000000000000000000 => 1
 */
export const parseToEth = (amount) => (amount ? ethers.utils.formatEther(`${amount}`) : 0);

/**
 * multiplies the amount by 10^18
 */
export const parseToWei = (amount) => ethers.utils.parseUnits(`${amount}`, 18).toString();

// create a function to specific error message based on error code
const getErrorMessage = (error) => {
  if (isObject(error)) {
    if ((error?.message || '').includes('OwnerOnly')) {
      return 'You are not the owner of the component/agent';
    }

    if ((error?.message || '').includes('WrongUnitId')) {
      return 'Unit ID is not valid';
    }

    if ((error?.message || '').includes('ClaimIncentivesFailed')) {
      return 'You do not have any rewards to claim';
    }

    if ((error?.message || '').includes('TransferFailed')) {
      return 'Transfer failed';
    }

    if ((error?.message || '').includes('execution reverted')) {
      return 'Nothing to claim for the connected wallet';
    }

    return error?.message || 'Some error occured';
  }

  return error || 'Some error occured';
};

export const getErrorDescription = (desc) => {
  // don't show error if it is due to compute units
  if ((desc || '').includes('app has exceeded its compute units ')) {
    return null;
  }

  return desc;
};

export const notifySpecificError = (error, desc) => {
  const message = getErrorMessage(error);
  const description = getErrorDescription(desc);
  notifyError(message, description);
};

/**
 * TODO: move to autonolas-library and figure out a better way
 * to fetch timestamp
 */
export const getBlockTimestamp = async (block = 'latest') => {
  const temp = await window?.WEB3_PROVIDER.eth.getBlock(block);
  return temp.timestamp * 1;
};

export const isL1Network = (chainId) => chainId === 1 || chainId === 5 || chainId === LOCAL_FORK_ID;
