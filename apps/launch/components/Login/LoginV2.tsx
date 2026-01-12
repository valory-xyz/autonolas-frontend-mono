import { GetAccountReturnType, watchAccount } from '@wagmi/core';
import { useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { useAccountEffect, useConfig, useDisconnect } from 'wagmi';

import { isAddressProhibited } from 'libs/util-prohibited-data/src/index';

interface WindowWithModalProvider extends Window {
  MODAL_PROVIDER?: unknown;
}

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
        (window as WindowWithModalProvider).MODAL_PROVIDER = modalProvider;
      }
    },
    [disconnect],
  );

  const clearOnDisconnect = useCallback(() => {
    delete (window as WindowWithModalProvider).MODAL_PROVIDER;
  }, []);

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
  }, [config, handleConnect]);

  return (
    <LoginContainer>
      <w3m-button balance="hide" />
    </LoginContainer>
  );
};
