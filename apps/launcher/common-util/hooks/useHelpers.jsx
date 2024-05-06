import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useAccount } from 'wagmi';

import {
  isL1Network as isL1NetworkFn,
  isL1OnlyNetwork as isL1OnlyNetworkFn,
} from '@autonolas/frontend-library';

import { isNumber } from 'lodash';

import { URL } from '../../util/constants';
import { doesNetworkHaveValidServiceManagerTokenFn } from '../functions';

export const useHelpers = () => {
  const { account, vmType, chainId, chainDisplayName, chainName } = useSelector(
    (state) => state?.setup,
  );
  const { chainId: chainIdFromWallet } = useAccount();

  /**
   * Links with chain name
   * eg. /ethereum/agents, /goerli/agents
   */
  const updatedLinks = Object.entries(URL).reduce((acc, [key, value]) => {
    acc[key] = `/${chainName}${value}`;
    return acc;
  }, {});

  /**
   * @returns {boolean} - true if the wallet is connected to wrong network
   * (ie. chain ID from wallet is different from the chain ID selected in the dropdown)
   */
  const isConnectedToWrongNetwork = useMemo(() => {
    if (!isNumber(chainIdFromWallet) || !isNumber(chainId)) return false;

    return chainIdFromWallet !== chainId;
  }, [chainId, chainIdFromWallet]);

  return {
    /**
     * @type {string | import("@solana/web3.js").PublicKey}
     * account - selected in the dropdown
     * If SVM, account is the public key of the phantom wallet
     * else account is the address of the selected wallet
     */
    account: account,
    vmType,
    chainId: chainId || chainIdFromWallet,
    chainDisplayName,
    chainName,
    isL1OnlyNetwork: isL1OnlyNetworkFn(chainId),
    isL1Network: isL1NetworkFn(chainId),
    doesNetworkHaveValidServiceManagerToken: doesNetworkHaveValidServiceManagerTokenFn(chainId),
    links: updatedLinks,
    isConnectedToWrongNetwork,
    isMainnet: chainId === 1,
  };
};
