import { useCallback, useEffect } from 'react';
import { SwapOutlined } from '@ant-design/icons';
import { GetAccountReturnType } from '@wagmi/core';
import { useAccount, useAccountEffect, useBalance, useSwitchChain } from 'wagmi';
import type { Address } from 'viem';
import type { BrowserProvider } from 'ethers';
import { isNil } from 'lodash';
import styled from 'styled-components';

import { useScreen } from 'libs/ui-theme/src';
import { useHelpers } from 'common-util/hooks';
import { YellowButton } from 'components/YellowButton';

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
  const { switchChainAsync, isPending } = useSwitchChain();
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
          const modalProvider = (await connector.getProvider()) as BrowserProvider;
          if (modalProvider) {
            // *******************************************************
            // ************ setting to the window object! ************
            // *******************************************************
            window.MODAL_PROVIDER = modalProvider;

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
    const modalProvider = window.MODAL_PROVIDER;
    // cleanup
    return () => {
      if (modalProvider && modalProvider.removeListener) {
        modalProvider.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const onSwitchNetwork = useCallback(async () => {
    try {
      if (!selectedChainId) return;
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
          loading={isPending}
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
