import { GetAccountReturnType, watchAccount } from '@wagmi/core';
import { useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { useAccountEffect, useConfig, useDisconnect } from 'wagmi';

import { isAddressProhibited } from 'libs/util-prohibited-data/src/index';

import { INVALIDATE_AFTER_ACCOUNT_CHANGE } from 'common-util/constants/scopeKeys';
import { queryClient } from 'context/Web3ModalProvider';
import { clearUserState } from 'store/govern';
import { useAppDispatch } from 'store/index';

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
