import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAccount } from 'wagmi';

import { getChainId } from '@autonolas/frontend-library';

import { isNumber } from 'lodash';
import { setChainId } from 'store/setup';

import { SUPPORTED_CHAINS } from 'common-util/Login';

import { VM_TYPE } from '../../util/constants';

export const useHelpers = () => {
  const dispatch = useDispatch();
  const wallet = useAnchorWallet();
  const { account, vmType, chainId } = useSelector((state) => state?.setup);
  const { chainId: chainIdFromWallet } = useAccount();

  /**
   * Set chainId to redux on page load.
   * This should be single source of truth for chainId
   */
  const currentChainId = getChainId(SUPPORTED_CHAINS);
  useEffect(() => {
    if (currentChainId !== chainId) {
      dispatch(setChainId(currentChainId));
    }
  }, [chainId, currentChainId, dispatch]);

  /**
   * @returns {boolean} - true if the wallet is connected to wrong network
   * (ie. chain ID from wallet is different from the chain ID selected in the dropdown)
   */
  const isConnectedToWrongNetwork = useMemo(() => {
    if (!isNumber(chainIdFromWallet) || !isNumber(chainId)) return false;

    return chainIdFromWallet !== chainId;
  }, [chainId, chainIdFromWallet]);

  const isSvm = vmType === VM_TYPE.SVM;

  return {
    /**
     * @type {string | import("@solana/web3.js").PublicKey}
     * account - selected in the dropdown
     * If SVM, account is the public key of the phantom wallet
     * else account is the address of the selected wallet
     */
    account: isSvm ? wallet?.publicKey : account,
    chainId,
    isConnectedToWrongNetwork,
    isSvm,
  };
};
