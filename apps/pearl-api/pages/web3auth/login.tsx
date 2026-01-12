import { Maybe } from '@web3auth/modal';
import { useWeb3Auth, useWeb3AuthConnect, useWeb3AuthDisconnect } from '@web3auth/modal/react';
import { useEffect, useRef } from 'react';
import { createGlobalStyle } from 'styled-components';
import { Address } from 'viem';

import { Web3AuthProvider } from 'context/Web3AuthProvider';

import { InitErrorAlert, Loading } from '../../components/web3auth';

export const Styles = createGlobalStyle`
  .w3a-parent-container > div {
    background-color: rgba(0, 0, 0, 0.45) !important;
  }
`;

enum Events {
  WEB3AUTH_AUTH_SUCCESS = 'WEB3AUTH_AUTH_SUCCESS',
  WEB3AUTH_MODAL_CLOSED = 'WEB3AUTH_MODAL_CLOSED',
  WEB3AUTH_MODAL_INITIALIZED = 'WEB3AUTH_MODAL_INITIALIZED',
}

const Web3AuthModal = () => {
  const { provider, isInitialized, web3Auth, initError } = useWeb3Auth();
  const { connect, isConnected } = useWeb3AuthConnect();
  const { disconnect } = useWeb3AuthDisconnect();
  const isAddressUpdated = useRef(false);

  // Notify once initialized
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      window.parent.postMessage({ event_id: Events.WEB3AUTH_MODAL_INITIALIZED }, '*');
    }
  }, [isInitialized]);

  // Connect when the page is open
  useEffect(() => {
    if (isInitialized && !isConnected) {
      connect();
    }
  }, [isInitialized, isConnected, connect]);

  // Receive connected wallet address and redirect to Pearl
  useEffect(() => {
    const getAccountAddressAndDisconnect = async () => {
      if (!provider) return;
      if (isAddressUpdated.current) return;

      try {
        const accounts: Maybe<Address[]> = await provider.request({
          method: 'eth_accounts',
        });

        if (!accounts || !accounts[0]) return;
        isAddressUpdated.current = true;
        disconnect();

        // Post message to the parent window with the connected address
        window.parent.postMessage(
          {
            event_id: Events.WEB3AUTH_AUTH_SUCCESS,
            address: accounts[0],
          },
          '*',
        );
      } catch (error) {
        console.error('Error getting address:', error);
      }
    };

    if (isConnected) {
      getAccountAddressAndDisconnect();
    }
  }, [disconnect, isConnected, provider]);

  // Notify if modal is closed
  useEffect(() => {
    if (!web3Auth) return;

    const handleClose = (isVisible: boolean) => {
      if (isVisible) return;
      window.parent.postMessage({ event_id: Events.WEB3AUTH_MODAL_CLOSED }, '*');
    };
    web3Auth.on('MODAL_VISIBILITY', handleClose);
    return () => {
      web3Auth.off('MODAL_VISIBILITY', handleClose);
    };
  }, [web3Auth, isConnected]);

  if (!isInitialized && !initError) return <Loading />;
  if (initError) return <InitErrorAlert error={initError as Error} />;

  return <div></div>;
};

export default function Page() {
  return (
    <>
      <Styles />

      <Web3AuthProvider>
        <Web3AuthModal />
      </Web3AuthProvider>
    </>
  );
}
