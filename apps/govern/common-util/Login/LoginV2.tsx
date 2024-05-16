import { GetAccountReturnType, watchAccount } from '@wagmi/core';
import { FC, useCallback, useEffect } from 'react';
import { useAccountEffect, useConfig, useDisconnect } from 'wagmi';

import styled from 'styled-components';

import { isAddressProhibited } from '../functions';

interface LoginProps {
  onConnect: (data: { address: `0x${string}` | undefined; chainId: number | undefined }) => void;
  onDisconnect: () => void;
}

const LoginContainer = styled.div`
  display: flex;
  align-items: center;
  font-size: 18px;
  line-height: normal;
`;

export const LoginV2: FC<LoginProps> = ({
  onConnect: onConnectCb,
  onDisconnect: onDisconnectCb,
}) => {
  const { disconnect } = useDisconnect();
  const config = useConfig();

  const handleConnect = useCallback(
    ({ address, chainId }: Pick<GetAccountReturnType, 'address' | 'chainId'>) => {
      if (isAddressProhibited(address)) {
        disconnect();
        if (onDisconnectCb) onDisconnectCb();
      } else if (onConnectCb) {
        onConnectCb({
          address,
          chainId,
        });
      }
    },
    [disconnect, onConnectCb, onDisconnectCb],
  );

  useAccountEffect({
    onConnect: handleConnect,
    onDisconnect() {
      if (onDisconnectCb) {
        onDisconnectCb();
      }
    },
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
