import { GetAccountReturnType, watchAccount } from '@wagmi/core';
import { useCallback, useEffect } from 'react';
import { useAccountEffect, useConfig, useDisconnect } from 'wagmi';

import { clearUserState } from 'store/launch';
import { useAppDispatch } from 'store/index';
import styled from 'styled-components';

import { INVALIDATE_AFTER_ACCOUNT_CHANGE } from 'common-util/constants/scopeKeys';

import { isAddressProhibited } from '../../common-util/functions';
import { queryClient } from '../../context/Web3ModalProvider';

const LoginContainer = styled.div`
  display: flex;
  align-items: center;
  font-size: 18px;
  line-height: normal;
`;

export const LoginV2 = () => {
  const { disconnect } = useDisconnect();
  const config = useConfig();
  const dispatch = useAppDispatch();

  const handleConnect = useCallback(
    ({ address }: Pick<GetAccountReturnType, 'address' | 'chainId'>) => {
      if (isAddressProhibited(address)) {
        disconnect();
      }
    },
    [disconnect],
  );

  const clearUserData = useCallback(() => {
    queryClient.removeQueries({
      predicate: (query) =>
        INVALIDATE_AFTER_ACCOUNT_CHANGE.includes(
          (query.queryKey[1] as Record<string, string>)?.scopeKey,
        ),
    });
    dispatch(clearUserState());
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
      <w3m-button balance="hide" />
    </LoginContainer>
  );
};
