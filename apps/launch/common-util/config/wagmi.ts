import { createConfig, http } from 'wagmi';
import {
  Chain,
  arbitrum,
  base,
  celo,
  gnosis,
  hardhat,
  mainnet,
  optimism,
  polygon,
  mode,
} from 'wagmi/chains';
import { coinbaseWallet, injected, safe, walletConnect } from 'wagmi/connectors';

import { RPC_URLS } from 'libs/util-constants/src';

export const SUPPORTED_CHAINS: [Chain, ...Chain[]] = [
  mainnet,
  gnosis,
  polygon,
  mode,
  optimism,
  base,
  arbitrum,
  celo,
  ...(process.env.NEXT_PUBLIC_IS_CONNECTED_TO_LOCAL === 'true' ? [hardhat] : []),
];

const walletConnectMetadata = {
  name: 'OLAS Launch',
  description: 'OLAS Launch Web3 Modal',
  url: 'https://launch.olas.network',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
};

export const wagmiConfig = createConfig({
  chains: SUPPORTED_CHAINS,
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLET_PROJECT_ID || '',
      metadata: walletConnectMetadata,
      showQrModal: false,
    }),
    safe(),
    coinbaseWallet({
      appName: walletConnectMetadata.name,
    }),
  ],
  transports: SUPPORTED_CHAINS.reduce(
    (acc, chain) => Object.assign(acc, { [chain.id]: http(RPC_URLS[chain.id]) }),
    {},
  ),
  ssr: true,
});
