import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet } from '@reown/appkit/networks';
import type { Chain } from 'viem';
import { cookieStorage, createStorage, http } from 'wagmi';

import { RPC_URLS } from 'libs/util-constants/src';

export const projectId = process.env.NEXT_PUBLIC_WALLET_PROJECT_ID;

export const SUPPORTED_CHAINS: [Chain, ...Chain[]] = [mainnet];

export const appKitMetadata = {
  name: 'OLAS Build',
  description: 'OLAS Build',
  url: 'https://build.olas.network',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
};

export const wagmiAdapter = new WagmiAdapter({
  networks: SUPPORTED_CHAINS,
  projectId: process.env.NEXT_PUBLIC_WALLET_PROJECT_ID || '',
  storage: createStorage({ storage: cookieStorage }),
  transports: SUPPORTED_CHAINS.reduce(
    (acc, chain) => Object.assign(acc, { [chain.id]: http(RPC_URLS[chain.id]) }),
    {},
  ),
  ssr: true,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
