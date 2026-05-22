import { getWagmiConnectorV2 } from '@binance/w3w-wagmi-connector-v2';
import type { Wallet } from '@rainbow-me/rainbowkit';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  coinbaseWallet,
  injectedWallet,
  metaMaskWallet,
  rainbowWallet,
  safeWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { cookieStorage, createConfig, createStorage, http } from 'wagmi';
import { Chain, base, mainnet } from 'wagmi/chains';

import { RPC_URLS } from 'libs/util-constants/src';
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from 'util/constants';

export const SUPPORTED_CHAINS: [Chain, ...Chain[]] = [mainnet, base];

export const projectId = process.env.NEXT_PUBLIC_WALLET_PROJECT_ID as string;

const binanceConnectorFn = getWagmiConnectorV2();

// Wrap the Binance WaaS connector as a RainbowKit-compatible wallet so it
// appears in the RainbowKit modal alongside the standard wallets.
const binanceWallet = (): Wallet => ({
  id: 'binance-w3w',
  name: 'Binance Wallet',
  iconUrl: '/images/binance-wallet.svg',
  iconBackground: '#F0B90B',
  createConnector: () => binanceConnectorFn(),
});

// RainbowKit wallets + custom Binance wallet. We use `connectorsForWallets`
// (instead of `getDefaultConfig`) so the Binance connector is part of the
// modal and clickable — not just registered as a wagmi connector.
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet, rainbowWallet, coinbaseWallet, walletConnectWallet, injectedWallet],
    },
    {
      groupName: 'Other',
      wallets: [safeWallet, binanceWallet],
    },
  ],
  {
    appName: SITE_TITLE,
    appDescription: SITE_DESCRIPTION,
    appUrl: SITE_URL,
    appIcon: 'https://avatars.githubusercontent.com/u/37784886',
    projectId,
  },
);

export const wagmiConfig = createConfig({
  chains: SUPPORTED_CHAINS,
  connectors,
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
  transports: SUPPORTED_CHAINS.reduce(
    (acc, chain) =>
      Object.assign(acc, { [chain.id]: http(RPC_URLS[chain.id as keyof typeof RPC_URLS]) }),
    {},
  ),
});
