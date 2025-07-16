import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { setChainId, useAppSelector } from 'store/setup';

import { getChainId } from '../functions';

export const useHelpers = () => {
  const dispatch = useDispatch();
  const account = useAppSelector((state) => state?.setup?.account);
  const chainId = useAppSelector((state) => state?.setup?.chainId);
  const isStaging = process.env.NEXT_PUBLIC_PFP_URL?.includes('staging');

  /**
   * Set chainId to redux on page load.
   * This should be single source of truth for chainId
   */
  const currentChainId = getChainId();
  useEffect(() => {
    if (currentChainId && currentChainId !== chainId) {
      dispatch(setChainId(currentChainId));
    }
  }, [currentChainId, chainId, dispatch]);

  return {
    chainId,
    account,
    isStaging,
  };
};
