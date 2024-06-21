import { SwapOutlined } from '@ant-design/icons';
import { Grid } from 'antd';
import { isNil } from 'lodash';
import PropTypes from 'prop-types';
import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { useAccount, useBalance, useDisconnect, useSwitchChain } from 'wagmi';

import { CannotConnectAddressOfacError, notifyError, useScreen } from '@autonolas/frontend-library';

import { setUserBalance } from 'store/setup';

import { YellowButton } from '../YellowButton';
import { isAddressProhibited } from '../functions';
import { useHelpers } from '../hooks';
import { SolanaWallet } from './SolanaWallet';

const { useBreakpoint } = Grid;

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
  theme = 'light',
}) => {
  const dispatch = useDispatch();
  const { isMobile } = useScreen();
  const { disconnect } = useDisconnect();
  const { chainId, isConnectedToWrongNetwork } = useHelpers();
  const { chain: walletConnectedChain } = useAccount();
  const { switchChainAsync, isPending } = useSwitchChain();

  const screens = useBreakpoint();

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
          connector?.options?.getProvider?.() || (await connector?.getProvider?.());

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

  const onSwitchNetwork = useCallback(async () => {
    try {
      await switchChainAsync({ chainId });
    } catch (error) {
      console.error(error);
    }
  }, [chainId, switchChainAsync]);

  useEffect(() => {
    if (isConnectedToWrongNetwork) {
      onSwitchNetwork();
    }
  }, [isConnectedToWrongNetwork, onSwitchNetwork]);

  const hideWrongNetwork = isNil(walletConnectedChain?.id) || walletConnectedChain?.id === chainId;

  return (
    <LoginContainer>
      {isSvm ? (
        <SolanaWallet />
      ) : (
        <>
          {!hideWrongNetwork && (
            <YellowButton
              loading={isPending}
              type="default"
              onClick={onSwitchNetwork}
              icon={<SwapOutlined />}>
              {!isMobile && 'Switch network'}
            </YellowButton>
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
