import { DownOutlined } from '@ant-design/icons';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { GetAccountReturnType, watchAccount } from '@wagmi/core';
import { Button, Space } from 'antd';
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
            <Space size={8}>
              <Button onClick={openChainModal}>
                {chain.iconUrl && (
                  <img
                    src={chain.iconUrl}
                    alt={chain.name ?? ''}
                    style={{
                      width: 16,
                      height: 16,
                      marginRight: 6,
                      borderRadius: '50%',
                      verticalAlign: 'middle',
                    }}
                  />
                )}
                {chain.name}
                <DownOutlined style={{ fontSize: 10, marginLeft: 6 }} />
              </Button>
              <Button onClick={openAccountModal}>
                <span
                  aria-hidden
                  style={{
                    display: 'inline-block',
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    marginRight: 8,
                    verticalAlign: 'middle',
                    background: 'linear-gradient(135deg, #7e22ce, #b5179e)',
                  }}
                />
                {account.displayName}
              </Button>
            </Space>
          );
        }}
      </ConnectButton.Custom>
    </LoginContainer>
  );
};
