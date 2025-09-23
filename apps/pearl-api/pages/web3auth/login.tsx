import { createGlobalStyle } from 'styled-components';
import { Maybe } from '@web3auth/modal';
import { useWeb3Auth, useWeb3AuthConnect, useWeb3AuthDisconnect } from '@web3auth/modal/react';
import { Web3AuthProvider } from 'context/Web3AuthProvider';
import { useEffect, useRef } from 'react';
import { Address } from 'viem';

export const Styles = createGlobalStyle`
  .w3a-parent-container > div {
    background-color: rgba(0, 0, 0, 0.45) !important;
  }
`;

enum Events {
  WEB3AUTH_AUTH_SUCCESS = 'WEB3AUTH_AUTH_SUCCESS',
  WEB3AUTH_MODAL_CLOSED = 'WEB3AUTH_MODAL_CLOSED',
  WEB3AUTH_MODAL_INITIALIZED = 'WEB3AUTH_MODAL_INITIALIZED'
}

const Web3AuthModal = () => {
  const { provider, isInitialized, web3Auth } = useWeb3Auth();
  const { connect, isConnected } = useWeb3AuthConnect();
  const { disconnect } = useWeb3AuthDisconnect();
  const isAddressUpdated = useRef(false);

  useEffect(() => {
    // Notify once initialized
    if (isInitialized)
    window.parent.postMessage({
      event_id: Events.WEB3AUTH_MODAL_INITIALIZED
    }, '*');
  }, [isInitialized])

  useEffect(() => {
    // Connect when the page is open
    if (isInitialized && !isConnected) {
      connect();
    }
  }, [isInitialized, isConnected, connect]);

  useEffect(() => {
    // Receive connected wallet address and redirect to Pearl
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
        window.parent.postMessage({
          event_id: Events.WEB3AUTH_AUTH_SUCCESS,
          address: accounts[0]
        }, '*');

      } catch (error) {
        console.error('Error getting address:', error);
      }
    };

    if (isConnected) {
      getAccountAddressAndDisconnect();
    }
  }, [disconnect, isConnected, provider]);

  useEffect(() => {
    // Notify if modal is closed
    if (!web3Auth) return;

    const handleClose = (isVisible: boolean) => {
      if (!isVisible && !isConnected) {
        window.parent.postMessage({
          event_id: Events.WEB3AUTH_MODAL_CLOSED
        }, '*');
      }
    };
    web3Auth.on('MODAL_VISIBILITY', handleClose);
    return () => {
      web3Auth.off('MODAL_VISIBILITY', handleClose);
    };
  }, [web3Auth, isConnected]);

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