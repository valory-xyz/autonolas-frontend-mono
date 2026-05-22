import { getWagmiConnectorV2 } from '@binance/w3w-wagmi-connector-v2';
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
import { SITE_TITLE } from 'util/constants';

export const SUPPORTED_CHAINS: [Chain, ...Chain[]] = [mainnet, base];

export const projectId = process.env.NEXT_PUBLIC_WALLET_PROJECT_ID as string;

// RainbowKit's default wallets + the Binance wagmi v2 connector. Binance is
// not in RainbowKit's standard wallet registry, so we use the
// `connectorsForWallets` escape hatch for RK wallets and append the binance
// connector separately. The combined connector list is passed to wagmi's
// `createConfig` (instead of RainbowKit's `getDefaultConfig`, which doesn't
// accept a `connectors` override).
const rkConnectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet, rainbowWallet, coinbaseWallet, walletConnectWallet, injectedWallet],
    },
    {
      groupName: 'Other',
      wallets: [safeWallet],
    },
  ],
  { appName: SITE_TITLE, projectId },
);

const binanceConnector = getWagmiConnectorV2();

export const wagmiConfig = createConfig({
  chains: SUPPORTED_CHAINS,
  connectors: [...rkConnectors, binanceConnector()],
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
  transports: SUPPORTED_CHAINS.reduce(
    (acc, chain) =>
      Object.assign(acc, { [chain.id]: http(RPC_URLS[chain.id as keyof typeof RPC_URLS]) }),
    {},
  ),
});
