import { SwapOutlined } from '@ant-design/icons';
import { GetAccountReturnType, watchAccount } from '@wagmi/core';
import { isNumber } from 'lodash';
import { useCallback, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useAccount, useAccountEffect, useConfig, useDisconnect, useSwitchChain } from 'wagmi';

import { useScreen } from 'libs/ui-theme/src';
import { isAddressProhibited } from 'libs/util-prohibited-data/src/index';

import { useAppSelector } from 'store/index';

import { YellowButton } from './YellowButton';

const LoginContainer = styled.div`
  display: flex;
  align-items: center;
  font-size: 18px;
  line-height: normal;
`;

export const LoginV2 = () => {
  const { disconnect } = useDisconnect();
  const config = useConfig();
  const { isMobile } = useScreen();
  const { chain: walletConnectedChain } = useAccount();
  const { networkId } = useAppSelector((state) => state.network);
  const { switchChainAsync, isPending } = useSwitchChain();

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

  /**
   * @returns {boolean} - true if the wallet is connected to wrong network
   * (ie. chain ID from wallet is different from the chain ID selected in the dropdown)
   */
  const isConnectedToWrongNetwork = useMemo(() => {
    if (!isNumber(walletConnectedChain?.id) || !isNumber(networkId)) return false;

    return walletConnectedChain?.id !== networkId;
  }, [walletConnectedChain, networkId]);

  const onSwitchNetwork = useCallback(async () => {
    if (!networkId) return;

    try {
      await switchChainAsync({ chainId: networkId });
    } catch (error) {
      console.error(error);
    }
  }, [networkId, switchChainAsync]);

  useEffect(() => {
    if (isConnectedToWrongNetwork) {
      onSwitchNetwork();
    }
  }, [isConnectedToWrongNetwork, onSwitchNetwork]);

  return (
    <LoginContainer>
      {isConnectedToWrongNetwork && (
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
      <w3m-button balance="hide" />
    </LoginContainer>
  );
};
