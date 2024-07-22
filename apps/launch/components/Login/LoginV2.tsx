import { GetAccountReturnType, watchAccount } from '@wagmi/core';
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
    ({ address }: Pick<GetAccountReturnType, 'address' | 'chainId'>) => {
      if (isAddressProhibited(address)) {
        disconnect();
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
      <w3m-button balance="hide" />
    </LoginContainer>
  );
};
