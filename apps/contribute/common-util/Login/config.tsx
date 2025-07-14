import { getWagmiConnectorV2 } from '@binance/w3w-wagmi-connector-v2';
import { cookieStorage, createConfig, createStorage, http } from 'wagmi';
import { Chain, base, mainnet } from 'wagmi/chains';
import { walletConnect } from 'wagmi/connectors';

import { RPC_URLS } from 'common-util/Contracts';
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from 'util/constants';

export const SUPPORTED_CHAINS: [Chain, ...Chain[]] = [mainnet, base];

export const projectId = process.env.NEXT_PUBLIC_WALLET_PROJECT_ID as string;

const metadata = {
  name: SITE_TITLE,
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
};

const binanceConnector = getWagmiConnectorV2();

export const wagmiConfig = createConfig({
  chains: SUPPORTED_CHAINS,
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
  transports: SUPPORTED_CHAINS.reduce(
    (acc, chain) =>
      Object.assign(acc, { [chain.id]: http(RPC_URLS[chain.id as keyof typeof RPC_URLS]) }),
    {},
  ),
  connectors: [
    walletConnect({
      projectId,
      metadata,
      showQrModal: false,
    }),
    binanceConnector(),
  ],
});
