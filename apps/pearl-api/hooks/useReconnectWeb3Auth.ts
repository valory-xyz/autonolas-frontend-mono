import { Web3Auth } from '@web3auth/modal';
import { useCallback, useRef } from 'react';

/**
 * Provides a callback to reset Web3Auth session and connect again
 */
export const useReconnectWeb3Auth = (web3Auth: Web3Auth | null) => {
  const hasReconnected = useRef(false);

  return useCallback(async () => {
    if (!web3Auth) return;
    if (hasReconnected.current) return;

    try {
      await web3Auth.logout({ cleanup: true });
      web3Auth.clearCache();
      await web3Auth.connect();
    } catch (error) {
      // Log the error; callers may also choose to handle this rejection
      console.error('Failed to reconnect Web3Auth session', error);
      throw error;
    } finally {
      hasReconnected.current = false;
    }
  }, [web3Auth]);
};
