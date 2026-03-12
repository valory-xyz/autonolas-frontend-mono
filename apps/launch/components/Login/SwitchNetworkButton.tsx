import { useAccount, useSwitchChain } from 'wagmi';

import { useAppSelector } from 'store/index';

import { SwitchNetworkButton as SwitchNetworkButtonComponent } from 'libs/ui-components/src';

export const SwitchNetworkButton = () => {
  const { chain: walletConnectedChain } = useAccount();
  const { networkId } = useAppSelector((state) => state.network);
  const { switchChainAsync, isPending } = useSwitchChain();

  return (
    <SwitchNetworkButtonComponent
      walletConnectedChain={walletConnectedChain}
      networkId={networkId}
      switchChainAsync={switchChainAsync}
      isPending={isPending}
    />
  );
};
