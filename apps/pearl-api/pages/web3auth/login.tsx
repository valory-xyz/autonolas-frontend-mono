import { Maybe } from '@web3auth/modal';
import { useWeb3Auth, useWeb3AuthConnect, useWeb3AuthDisconnect } from '@web3auth/modal/react';
import { useEffect, useRef } from 'react';
import { createGlobalStyle } from 'styled-components';
import { Address } from 'viem';

import { Web3AuthProvider } from 'context/Web3AuthProvider';
import { useReconnectWeb3Auth } from 'hooks/useReconnectWeb3Auth';
import type { Web3AuthPageProps } from 'types/web3auth';
import { getWeb3AuthPageProps } from 'utils/web3authFlag';

import { WEB3AUTH_LOGIN_EVENTS } from '../../constants/web3auth';

import { InitErrorAlert, Loading, Web3AuthDisabled } from '../../components/web3auth';

export const Styles = createGlobalStyle`
  .w3a-parent-container > div {
    background-color: rgba(0, 0, 0, 0.45) !important;
  }
`;

// The init/close events live in WEB3AUTH_LOGIN_EVENTS, shared with the disabled view.
enum Events {
  WEB3AUTH_AUTH_SUCCESS = 'WEB3AUTH_AUTH_SUCCESS',
}

const Web3AuthModal = () => {
  const { provider, isInitialized, web3Auth, initError } = useWeb3Auth();
  const { connect, isConnected } = useWeb3AuthConnect();
  const { disconnect } = useWeb3AuthDisconnect();
  const reconnect = useReconnectWeb3Auth(web3Auth);
  const isAddressUpdated = useRef(false);

  // Notify once initialized
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      window.parent.postMessage({ event_id: WEB3AUTH_LOGIN_EVENTS.initialized }, '*');
    }
  }, [isInitialized]);

  // Connect when the page is open
  useEffect(() => {
    if (isInitialized && !isConnected) {
      const attemptConnect = async () => {
        try {
          await connect();
        } catch (e) {
          const message = (e as Error)?.message ?? '';
          if (message.includes('Session Expired')) {
            try {
              await reconnect();
            } catch (reconnectError) {
              console.error('Error during Web3Auth reconnection:', reconnectError);
            }
          }
        }
      };

      attemptConnect();
    }
  }, [isInitialized, isConnected, connect, reconnect]);

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
      window.parent.postMessage({ event_id: WEB3AUTH_LOGIN_EVENTS.closed }, '*');
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

const DISABLED_MESSAGE =
  'Setting up a backup wallet with Google or Apple is temporarily disabled. Close this window and enter a wallet address instead.';

export const getServerSideProps = getWeb3AuthPageProps;

export default function Page({ web3AuthEnabled }: Web3AuthPageProps) {
  if (!web3AuthEnabled) {
    return <Web3AuthDisabled events={WEB3AUTH_LOGIN_EVENTS} message={DISABLED_MESSAGE} />;
  }

  return (
    <>
      <Styles />

      <Web3AuthProvider>
        <Web3AuthModal />
      </Web3AuthProvider>
    </>
  );
}
