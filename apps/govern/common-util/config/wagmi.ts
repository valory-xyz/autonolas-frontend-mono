import { http, createConfig } from 'wagmi';
import {
  safe,
  walletConnect,
  injected,
  coinbaseWallet,
} from 'wagmi/connectors';
import { RPC_URLS } from 'common-util/constants/rpcs';
import { Chain, mainnet } from 'wagmi/chains';

export const SUPPORTED_CHAINS: [Chain, ...Chain[]] = [mainnet, ];

const walletConnectMetadata = {
  name: 'Govern',
  description: '',
  url: 'https://govern.olas.network',
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
    (acc, chain) =>
      Object.assign(acc, { [chain.id]: http(RPC_URLS[chain.id]) }),
    {},
  ),
});
