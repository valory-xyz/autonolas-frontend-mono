import { SwapOutlined } from '@ant-design/icons';
import { GetAccountReturnType } from '@wagmi/core';
import { isNil } from 'lodash';
import { useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { Address } from 'viem';
import { useAccount, useAccountEffect, useBalance, useSwitchChain } from 'wagmi';

import { YellowButton } from 'common-util/YellowButton';
import { useHelpers, useScreen } from 'common-util/hooks';

const LoginContainer = styled.div`
  display: flex;
  align-items: center;
  font-size: 18px;
  line-height: normal;
  padding: 8px 0;
`;

type LoginV2Props = {
  onConnect: ({
    address,
    balance,
    chainId,
  }: {
    address: Address | undefined;
    balance: string | undefined;
    chainId: number | undefined;
  }) => void;
  onDisconnect: () => void;
};

const handleChainChanged = () => {
  window.location.reload();
};

export const LoginV2 = ({ onConnect: onConnectCb, onDisconnect: onDisconnectCb }: LoginV2Props) => {
  const { address, chain } = useAccount();
  const { switchChainAsync, isLoading } = useSwitchChain();
  const { data } = useBalance({ address });
  const { isMobile } = useScreen();
  const { isConnectedToWrongNetwork, chainId: selectedChainId } = useHelpers();

  const chainId = chain?.id;

  const handleConnect = useCallback(
    async ({
      address: currentAddress,
      connector,
    }: Pick<GetAccountReturnType, 'address' | 'connector'>) => {
      if (onConnectCb) {
        onConnectCb({
          address: address || currentAddress,
          balance: data?.formatted,
          chainId,
        });
      }

      if (connector) {
        try {
          // This is the initial `provider` that is returned when
          // using web3Modal to connect. Can be MetaMask or WalletConnect.
          const modalProvider = (await connector.getProvider()) as any;

          if (modalProvider) {
            // *******************************************************
            // ************ setting to the window object! ************
            // *******************************************************
            (window as any).MODAL_PROVIDER = modalProvider;

            if (modalProvider?.on) {
              // https://docs.ethers.io/v5/concepts/best-practices/#best-practices--network-changes

              modalProvider.on('chainChanged', handleChainChanged);
            }
          }
        } catch (error) {
          console.error(error);
        }
      }
    },
    [address, chainId, data?.formatted, onConnectCb],
  );

  useAccountEffect({
    onConnect: handleConnect,
    onDisconnect() {
      if (onDisconnectCb) onDisconnectCb();
    },
  });

  useEffect(() => {
    const modalProvider = (window as any).MODAL_PROVIDER;
    // cleanup
    return () => {
      if (modalProvider && modalProvider.removeListener) {
        modalProvider.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const onSwitchNetwork = useCallback(async () => {
    try {
      await switchChainAsync({ chainId: selectedChainId });
    } catch (error) {
      console.error(error);
    }
  }, [selectedChainId, switchChainAsync]);

  useEffect(() => {
    if (isConnectedToWrongNetwork) {
      onSwitchNetwork();
    }
  }, [isConnectedToWrongNetwork, onSwitchNetwork]);

  const showWrongNetwork =
    (!!address && isNil(chain)) || (!isNil(chainId) && chainId !== selectedChainId);

  return (
    <LoginContainer>
      {showWrongNetwork && (
        <YellowButton
          loading={isLoading}
          type="default"
          onClick={onSwitchNetwork}
          icon={<SwapOutlined />}
        >
          {!isMobile && 'Switch network'}
        </YellowButton>
      )}
      &nbsp;&nbsp;
      <w3m-button balance={'hide'} />
    </LoginContainer>
  );
};
