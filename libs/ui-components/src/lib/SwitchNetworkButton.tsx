import { SwapOutlined } from '@ant-design/icons';
import { isNumber } from 'lodash';
import { useCallback, useEffect, useMemo } from 'react';
import { Config } from 'wagmi';

// eslint-disable-next-line @nx/enforce-module-boundaries
import { COLOR, useScreen } from 'libs/ui-theme/src';
import { Button, ButtonProps, ConfigProvider } from 'antd';
import { Chain } from 'viem';
import { SwitchChainMutateAsync } from 'wagmi/query';

type YellowButtonProps = ButtonProps & {
  children: React.ReactNode;
};

export const YellowButton = ({ children, ...props }: YellowButtonProps) => (
  <ConfigProvider
    theme={{
      token: {
        colorPrimary: COLOR.YELLOW_PRIMARY,
        colorBgBase: COLOR.YELLOW_SECONDARY,
        colorTextBase: COLOR.YELLOW_PRIMARY,
        colorBorder: COLOR.YELLOW_PRIMARY,
      },
    }}
  >
    <Button {...props} size="large">
      {children}
    </Button>
  </ConfigProvider>
);

type SwitchNetworkButtonProps = {
  walletConnectedChain: Chain | undefined;
  networkId: number | null;
  switchChainAsync: SwitchChainMutateAsync<Config, unknown>;
  isPending: boolean;
};

export const SwitchNetworkButton = ({
  walletConnectedChain,
  networkId,
  switchChainAsync,
  isPending,
}: SwitchNetworkButtonProps) => {
  const { isMobile } = useScreen();

  /**
   * @returns {boolean} - true if the wallet is connected to wrong network
   * (ie. chain ID from wallet is different from the provided chain ID e.g. selected in the dropdown)
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
