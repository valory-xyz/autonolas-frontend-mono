import { Web3Auth } from '@web3auth/modal';
import { useCallback, useRef } from 'react';

/**
 * Provides a callback to reset Web3Auth session and connect again
 */
export const useReconnectWeb3Auth = (web3Auth: Web3Auth | null) => {
  const hasReconnected = useRef(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(async () => {
    if (!web3Auth) return;
    if (hasReconnected.current) return;
    hasReconnected.current = true;

    await web3Auth.logout({ cleanup: true });
    web3Auth.clearCache();
    await web3Auth.connect();
  }, [web3Auth]);
};
