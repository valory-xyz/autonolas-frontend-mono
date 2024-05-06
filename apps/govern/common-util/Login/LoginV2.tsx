import { Grid } from 'antd';
import { useEffect, FC } from 'react';
import { useDispatch } from 'react-redux';
import { useAccount, useAccountEffect, useBalance, useDisconnect } from 'wagmi';

import { CannotConnectAddressOfacError, notifyError } from '@autonolas/frontend-library';

import styled from 'styled-components';

import { isAddressProhibited } from '../functions';
import { useHelpers } from '../hooks';
import { SolanaWallet } from './SolanaWallet';
import { setUserBalance } from 'store/setup';

const { useBreakpoint } = Grid;

interface LoginProps {
  onConnect: (data: { address: string; }) => void;
  onDisconnect: () => void;
  isSvm?: boolean;
}

const LoginContainer = styled.div`
  display: flex;
  align-items: center;
  font-size: 18px;
  line-height: normal;
`;

export const LoginV2: FC<LoginProps> = ({
  isSvm = false,
  onConnect: onConnectCb,
  onDisconnect: onDisconnectCb,
}) => {
  const dispatch = useDispatch();
  const { disconnect } = useDisconnect();
  const { chainId } = useHelpers();

  const screens = useBreakpoint();

  useAccountEffect({
    onConnect: ({ address: currentAddress }) => {
      if (isAddressProhibited(currentAddress)) {
        disconnect();
      } else if (onConnectCb && chainId) {
        onConnectCb({
          address: address || currentAddress,
        });
      }
    },
    onDisconnect() {
      if (onDisconnectCb) onDisconnectCb();
    },
  });

  const { address, connector } = useAccount();

   // Update the balance
   const { data: balance } = useBalance({ address, chainId });

   useEffect(() => {
     if (chainId && balance?.formatted) {
       dispatch(setUserBalance(balance.formatted));
     }
   }, [chainId, balance?.formatted, dispatch]);

  useEffect(() => {
    // TODO: make the reload correctly
    const getData = async () => {
      try {
        // This is the initial `provider` that is returned when
        // using web3Modal to connect. Can be MetaMask or WalletConnect.
        const modalProvider =
          connector?.getProvider?.() || (await connector?.getProvider?.()) as any;

        if (modalProvider) {
          // *******************************************************
          // ************ setting to the window object! ************
          // *******************************************************
          (window as any).MODAL_PROVIDER = modalProvider;

          if (modalProvider?.on) {
            // https://docs.ethers.io/v5/concepts/best-practices/#best-practices--network-changes
            const handleChainChanged = () => {
              window.location.reload();
            };

            modalProvider.on('chainChanged', handleChainChanged);

            // cleanup
            return () => {
              if (modalProvider.removeListener) {
                modalProvider.removeListener('chainChanged', handleChainChanged);
              }
            };
          }
        }

        return () => null;
      } catch (error) {
        console.error(error);
        return () => null;
      }
    };

    if (connector && !isAddressProhibited(address)) {
      getData();
    }
  }, [address, connector]);

  // Disconnect if the address is prohibited
  useEffect(() => {
    if (address && isAddressProhibited(address)) {
      disconnect();
      notifyError(<CannotConnectAddressOfacError />);
      if (onDisconnectCb) onDisconnectCb();
    }
  }, [address, disconnect, onDisconnectCb]);

  return (
    <LoginContainer>
      {isSvm ? (
        <SolanaWallet />
      ) : (
        <>
          <w3m-button balance={screens.xs ? 'hide' : 'show'} />
        </>
      )}
    </LoginContainer>
  );
};
