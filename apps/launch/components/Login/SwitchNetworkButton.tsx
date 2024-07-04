import { SwapOutlined } from '@ant-design/icons';
import { isNumber } from 'lodash';
import { useCallback, useEffect, useMemo } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';

import { useScreen } from 'libs/ui-theme/src';

import { useAppSelector } from 'store/index';

import { YellowButton } from './YellowButton';

export const SwitchNetworkButton = () => {
  const { isMobile } = useScreen();
  const { chain: walletConnectedChain } = useAccount();
  const { networkId } = useAppSelector((state) => state.network);
  const { switchChainAsync, isPending } = useSwitchChain();

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

  if (!isConnectedToWrongNetwork) return null;
  return (
    <YellowButton
      loading={isPending}
      type="default"
      onClick={onSwitchNetwork}
      icon={<SwapOutlined />}
    >
      {!isMobile && 'Switch network'}
    </YellowButton>
  );
};
