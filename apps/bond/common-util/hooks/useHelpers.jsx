import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DEFAULT_CHAIN_ID } from 'common-util/config/wagmi';
import { getChainId } from 'common-util/functions';
import { setChainId } from 'store/setup';

export const useHelpers = () => {
  const dispatch = useDispatch();
  const account = useSelector((state) => state?.setup?.account);
  const storedChainId = useSelector((state) => state?.setup?.chainId);

  // Redux holds null until the effect below runs, so during a server render and on the first
  // client render every consumer saw null. The Layout gates the whole page body on this, so the
  // app served no content to crawlers at all; and `ADDRESSES[chainId]` would throw for anything
  // that did render. Defaulting matches what an unconnected visitor resolves to anyway, and a
  // connected wallet still wins as soon as the effect lands.
  const chainId = storedChainId ?? DEFAULT_CHAIN_ID;

  /**
   * Set chainId to redux on page load.
   * This should be single source of truth for chainId
   */
  const currentChainId = getChainId();
  useEffect(() => {
    if (currentChainId && currentChainId !== storedChainId) {
      dispatch(setChainId(currentChainId));
    }
  }, [storedChainId, currentChainId, dispatch]);

  return {
    chainId,
    account,
  };
};
