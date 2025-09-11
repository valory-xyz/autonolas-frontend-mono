import { createGlobalStyle } from 'styled-components';
import { Maybe } from '@web3auth/modal';
import { useWeb3Auth, useWeb3AuthConnect, useWeb3AuthDisconnect } from '@web3auth/modal/react';
import { Web3AuthProvider } from 'context/Web3AuthProvider';
import { useEffect, useRef } from 'react';
import { WEB3AUTH_AUTH_SUCCESS_URL, WEB3AUTH_MODAL_CLOSED_URL } from 'util/constants';
import { Address } from 'viem';

export const Styles = createGlobalStyle`
  .w3a-parent-container > div {
    background-color: rgba(0, 0, 0, 0.45) !important;
  }
`;

const Web3AuthModal = () => {
  const { provider, isInitialized, web3Auth } = useWeb3Auth();
  const { connect, isConnected } = useWeb3AuthConnect();
  const { disconnect } = useWeb3AuthDisconnect();
  const isAddressUpdated = useRef(false);

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
        window.location.href = `${WEB3AUTH_AUTH_SUCCESS_URL}?address=${accounts[0]}`;
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
        window.location.href = WEB3AUTH_MODAL_CLOSED_URL;
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
