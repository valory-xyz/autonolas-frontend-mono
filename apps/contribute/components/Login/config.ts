import { getWagmiConnectorV2 } from '@binance/w3w-wagmi-connector-v2';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { base, mainnet } from '@reown/appkit/networks';
import type { Chain } from 'viem';
import { cookieStorage, createStorage, http } from 'wagmi';

import { RPC_URLS } from 'libs/util-constants/src';
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from 'util/constants';

export const SUPPORTED_CHAINS: [Chain, ...Chain[]] = [mainnet, base];

export const projectId = process.env.NEXT_PUBLIC_WALLET_PROJECT_ID as string;

export const appKitMetadata = {
  name: SITE_TITLE,
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
};

const binanceConnector = getWagmiConnectorV2();

export const wagmiAdapter = new WagmiAdapter({
  networks: SUPPORTED_CHAINS,
  projectId,
  storage: createStorage({ storage: cookieStorage }),
  transports: SUPPORTED_CHAINS.reduce(
    (acc, chain) =>
      Object.assign(acc, { [chain.id]: http(RPC_URLS[chain.id as keyof typeof RPC_URLS]) }),
    {},
  ),
  connectors: [binanceConnector()],
  ssr: true,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
