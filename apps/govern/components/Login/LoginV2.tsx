import { ConnectButton } from '@rainbow-me/rainbowkit';
import { GetAccountReturnType, watchAccount } from '@wagmi/core';
import { Button, Space } from 'antd';
import { useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { useAccountEffect, useConfig, useDisconnect } from 'wagmi';

import { isAddressProhibited } from 'libs/util-prohibited-data/src/index';

import { INVALIDATE_AFTER_USER_DATA_CHANGE } from 'common-util/constants/scopeKeys';
import { clearUserState } from 'store/govern';
import { useAppDispatch } from 'store/index';
import { resetState } from 'common-util/functions/resetState';

const LoginContainer = styled.div`
  display: flex;
  align-items: center;
  line-height: normal;
`;

export const LoginV2 = () => {
  const { disconnect } = useDisconnect();
  const config = useConfig();
  const dispatch = useAppDispatch();

  const handleConnect = useCallback(
    async ({ address, connector }: Pick<GetAccountReturnType, 'address' | 'connector'>) => {
      if (isAddressProhibited(address)) {
        disconnect();
      }

      if (connector) {
        const modalProvider = await connector.getProvider?.();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).MODAL_PROVIDER = modalProvider;
      }
    },
    [disconnect],
  );

  const clearUserData = useCallback(() => {
    resetState(INVALIDATE_AFTER_USER_DATA_CHANGE, dispatch, clearUserState);
  }, [dispatch]);

  useAccountEffect({
    onConnect: handleConnect,
    onDisconnect: clearUserData,
  });

  useEffect(() => {
    const unwatch = watchAccount(config, {
      onChange: (account: GetAccountReturnType, prevAccount: GetAccountReturnType) => {
        if (account.address !== prevAccount.address && account.isConnected) {
          handleConnect(account);

          // Clear user data if switched from one account to another
          if (prevAccount.address !== undefined) {
            clearUserData();
          }
        }
      },
    });
    return () => unwatch();
  }, [config, clearUserData, handleConnect]);

  return (
    <LoginContainer>
      <ConnectButton.Custom>
        {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
          if (!mounted) return null;

          if (!account || !chain) {
            return (
              <Button type="primary" onClick={openConnectModal}>
                Connect Wallet
              </Button>
            );
          }

          if (chain.unsupported) {
            return (
              <Button danger onClick={openChainModal}>
                Wrong network
              </Button>
            );
          }

          return (
            <Space size={4}>
              <Button size="small" onClick={openChainModal}>
                {chain.name}
              </Button>
              <Button size="small" onClick={openAccountModal}>
                {account.displayName}
              </Button>
            </Space>
          );
        }}
      </ConnectButton.Custom>
    </LoginContainer>
  );
};
