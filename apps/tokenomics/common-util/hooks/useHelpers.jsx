import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getChainId } from 'common-util/functions';
import { setChainId } from 'store/setup/actions';

export const useHelpers = () => {
  const dispatch = useDispatch();
  const account = useSelector((state) => state?.setup?.account);
  const chainId = useSelector((state) => state?.setup?.chainId);

  /**
   * Set chainId to redux on page load.
   * This should be single source of truth for chainId
   */
  const currentChainId = getChainId();
  useEffect(() => {
    if (currentChainId !== chainId) {
      dispatch(setChainId(currentChainId));
    }
  }, [chainId, currentChainId, dispatch]);

  return {
    chainId,
    account,
  };
};
