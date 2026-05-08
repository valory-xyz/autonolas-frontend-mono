import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, goerli } from '@reown/appkit/networks';
import { cookieStorage, createStorage, http } from 'wagmi';
import { safe } from 'wagmi/connectors';

import { RPC_URLS } from 'common-util/constants/rpcs';

export const SUPPORTED_CHAINS = [mainnet, goerli];

export const appKitMetadata = {
  name: 'OLAS Bond',
  description: 'OLAS Bond',
  url: 'https://bond.olas.network',
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
  connectors: [safe()],
  ssr: true,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
