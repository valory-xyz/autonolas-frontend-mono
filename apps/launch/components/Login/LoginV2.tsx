import { ConnectButton } from '@rainbow-me/rainbowkit';
import { GetAccountReturnType, watchAccount } from '@wagmi/core';
import { Button } from 'antd';
import { useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { useAccountEffect, useConfig, useDisconnect } from 'wagmi';

import { isAddressProhibited } from 'libs/util-prohibited-data/src/index';

const LoginContainer = styled.div`
  display: flex;
  align-items: center;
  line-height: normal;
`;

export const LoginV2 = () => {
  const { disconnect } = useDisconnect();
  const config = useConfig();

  const handleConnect = useCallback(
    async ({ address, connector }: Pick<GetAccountReturnType, 'address' | 'connector'>) => {
      if (isAddressProhibited(address)) {
        disconnect();
      }

      if (connector) {
        const modalProvider = await connector.getProvider();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).MODAL_PROVIDER = modalProvider;
      }
    },
    [disconnect],
  );

  const clearOnDisconnect = useCallback(() => {}, []);

  useAccountEffect({
    onConnect: handleConnect,
    onDisconnect: clearOnDisconnect,
  });

  useEffect(() => {
    const unwatch = watchAccount(config, {
      onChange: (account: GetAccountReturnType, prevAccount: GetAccountReturnType) => {
        if (account.address !== prevAccount.address && account.isConnected) {
          handleConnect(account);
        }
      },
    });
    return () => unwatch();
  }, [config, clearOnDisconnect, handleConnect]);

  return (
    <LoginContainer>
      <ConnectButton.Custom>
        {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
          if (!mounted) return null;

          if (!account || !chain) {
            return (
              <Button size="large" type="primary" onClick={openConnectModal}>
                Connect Wallet
              </Button>
            );
          }

          if (chain.unsupported) {
            return (
              <Button size="large" danger onClick={openChainModal}>
                Wrong network
              </Button>
            );
          }

          // launch's Layout has its own URL-routed SwitchNetworkSelect, so we
          // don't render a chain pill here to avoid duplicating it. Only the
          // address pill.
          return (
            <Button size="large" onClick={openAccountModal}>
              <span
                aria-hidden
                style={{
                  display: 'inline-block',
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  marginRight: 8,
                  verticalAlign: 'middle',
                  background: 'linear-gradient(135deg, #7e22ce, #b5179e)',
                }}
              />
              {account.displayName}
            </Button>
          );
        }}
      </ConnectButton.Custom>
    </LoginContainer>
  );
};
