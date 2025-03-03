import { useAccount, useSwitchChain } from 'wagmi';

import { SwitchNetworkButton as SwitchNetworkButtonComponent } from 'libs/ui-components/src';
import { mainnet } from 'viem/chains';

export const SwitchNetworkButton = () => {
  const { chain: walletConnectedChain } = useAccount();
  const { switchChainAsync, isPending } = useSwitchChain();

  return (
    <SwitchNetworkButtonComponent
      walletConnectedChain={walletConnectedChain}
      networkId={mainnet.id}
      switchChainAsync={switchChainAsync}
      isPending={isPending}
    />
  );
};
