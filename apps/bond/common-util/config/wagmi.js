import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { goerli, mainnet } from 'wagmi/chains';

import { RPC_URLS } from 'common-util/constants/rpcs';

export const SUPPORTED_CHAINS = [mainnet, goerli];

export const wagmiConfig = getDefaultConfig({
  appName: 'OLAS Bond',
  projectId: process.env.NEXT_PUBLIC_WALLET_PROJECT_ID || '',
  chains: SUPPORTED_CHAINS,
  transports: SUPPORTED_CHAINS.reduce(
    (acc, chain) => Object.assign(acc, { [chain.id]: http(RPC_URLS[chain.id]) }),
    {},
  ),
  ssr: true,
});
