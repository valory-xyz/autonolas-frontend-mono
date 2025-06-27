import { isNumber } from 'lodash';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useAccount, useChainId } from 'wagmi';

import { getIsValidChainId } from '../functions';

export const useHelpers = () => {
  // @ts-ignore TODO: add types
  const account = useSelector((state) => state?.setup?.account);
  // @ts-ignore TODO: add types
  const chainId = useSelector((state) => state?.setup?.chainId);

  const { chain } = useAccount();
  const chainIdFromWallet = chain?.id;

  /**
   * @returns {boolean} - true if the wallet is connected to wrong network
   * (ie. chain ID from wallet is different from the chain ID selected in the dropdown)
   */
  const isConnectedToWrongNetwork = useMemo(() => {
    if (!isNumber(chainIdFromWallet) || !isNumber(chainId)) return false;

    return chainIdFromWallet !== chainId;
  }, [chainId, chainIdFromWallet]);

  return {
    chainId,
    account,
    isConnectedToWrongNetwork,
    isValidChainId: getIsValidChainId(chainId),
  };
};
