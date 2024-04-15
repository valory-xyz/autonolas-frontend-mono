import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { isNil } from 'lodash';
import {
  useAccount,
  useBalance,
  useDisconnect,
  useSwitchAccount,
} from 'wagmi';
import styled from 'styled-components';
import {
  CannotConnectAddressOfacError,
  notifyError,
  useScreen,
} from '@autonolas/frontend-library';

import { setUserBalance } from '../../store/setup';
import { isAddressProhibited } from '../functions';
import { useHelpers } from '../hooks';
import { SolanaWallet } from './SolanaWallet';

const LoginContainer = styled.div`
  display: flex;
  align-items: center;
  font-size: 18px;
  line-height: normal;
`;

export const LoginV2 = ({
  isSvm,
  onConnect: onConnectCb,
  onDisconnect: onDisconnectCb,
}) => {
  const dispatch = useDispatch();
  const { disconnect } = useDisconnect();
  const screens = useScreen();
  const { chainId, isConnectedToWrongNetwork } = useHelpers();
  const { chain: walletConnectedChain } = useAccount();
  const { switchChain } = useSwitchAccount();

  const { address, connector } = useAccount({
    onConnect: ({ address: currentAddress }) => {
      if (isAddressProhibited(currentAddress)) {
        disconnect();
      } else if (onConnectCb && chainId) {
        onConnectCb({
          address: address || currentAddress,
          balance: null,
          chainId,
        });
      }
    },
    onDisconnect() {
      if (onDisconnectCb) onDisconnectCb();
    },
  });

  // Update the balance
  const { data: balance } = useBalance({ address, chainId });

  useEffect(() => {
    if (chainId && balance?.formatted) {
      dispatch(setUserBalance(balance.formatted));
    }
  }, [chainId, balance?.formatted, dispatch]);

  useEffect(() => {
    const getData = async () => {
      try {
        // This is the initial `provider` that is returned when
        // using web3Modal to connect. Can be MetaMask or WalletConnect.
        const modalProvider =
          connector?.options?.getProvider?.() ||
          (await connector?.getProvider?.());

        if (modalProvider) {
          // *******************************************************
          // ************ setting to the window object! ************
          // *******************************************************
          window.MODAL_PROVIDER = modalProvider;

          if (modalProvider?.on) {
            // https://docs.ethers.io/v5/concepts/best-practices/#best-practices--network-changes
            const handleChainChanged = () => {
              window.location.reload();
            };

            modalProvider.on('chainChanged', handleChainChanged);

            // cleanup
            return () => {
              if (modalProvider.removeListener) {
                modalProvider.removeListener(
                  'chainChanged',
                  handleChainChanged,
                );
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

  const onSwitchNetwork = useCallback(async () => {
    try {
      await switchChain(chainId);
    } catch (error) {
      console.error(error);
    }
  }, [chainId, switchChain]);

  useEffect(() => {
    if (isConnectedToWrongNetwork) {
      onSwitchNetwork();
    }
  }, [isConnectedToWrongNetwork, onSwitchNetwork]);

  const hideWrongNetwork =
    isNil(walletConnectedChain?.id) || walletConnectedChain?.id === chainId;

  return (
    <LoginContainer>
      {isSvm ? (
        <SolanaWallet />
      ) : (
        <>
          {!hideWrongNetwork && (            
            <w3m-network-button />
          )}
          &nbsp;&nbsp;
          <w3m-button balance={screens.xs ? 'hide' : 'show'} />
        </>
      )}
    </LoginContainer>
  );
};

LoginV2.propTypes = {
  isSvm: PropTypes.bool,
  onConnect: PropTypes.func,
  onDisconnect: PropTypes.func,
  theme: PropTypes.string,
};

LoginV2.defaultProps = {
  isSvm: false,
  onConnect: undefined,
  onDisconnect: undefined,
  theme: 'light',
};
