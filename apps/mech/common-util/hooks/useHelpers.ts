import { isNumber } from 'lodash';
import { useMemo } from 'react';
import { useAccount } from 'wagmi';

import { useAppSelector } from 'store/index';
import { getIsValidChainId } from '../functions';

export const useHelpers = () => {
  const account = useAppSelector((state) => state?.setup?.account);
  const chainId = useAppSelector((state) => state?.setup?.chainId);

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
    isValidChainId: getIsValidChainId(chainId ?? 0),
  };
};
