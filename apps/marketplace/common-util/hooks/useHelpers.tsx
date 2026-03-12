import { useMemo } from 'react';
import { isNumber } from 'lodash';
import { useAccount } from 'wagmi';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { isL1Network as isL1NetworkFn } from 'libs/util-functions/src';

import { URL } from '../../util/constants';
import { doesNetworkHaveValidServiceManagerTokenFn } from '../functions';
import { useAppSelector } from 'store/index';
import { VM_TYPE } from 'libs/util-constants/src';

export const useHelpers = () => {
  const wallet = useAnchorWallet();
  const { account, vmType, chainId, chainDisplayName, chainName } = useAppSelector(
    (state) => state?.setup,
  );
  const { chainId: chainIdFromWallet } = useAccount();

  /**
   * Links with chain name
   * eg. /ethereum/agents, /goerli/agents
   */
  const updatedLinks = Object.entries(URL).reduce(
    (acc, [key, value]) => {
      acc[key] = `/${chainName}${value}`;
      return acc;
    },
    {} as Record<string, string>,
  );

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
    account: isSvm ? (wallet?.publicKey as unknown as string) : account,
    vmType,
    chainId,
    chainDisplayName,
    chainName,
    isL1Network: isL1NetworkFn(chainId!),
    doesNetworkHaveValidServiceManagerToken: doesNetworkHaveValidServiceManagerTokenFn(chainId!),
    links: updatedLinks,
    isConnectedToWrongNetwork,
    isMainnet: chainId === 1,
    isSvm,
  };
};
