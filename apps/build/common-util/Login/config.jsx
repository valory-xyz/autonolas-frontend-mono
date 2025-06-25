import { createConfig } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import {
  coinbaseWallet,
  injected,
  safe,
  walletConnect,
} from 'wagmi/connectors';
import { http } from 'viem';
import { RPC_URLS } from 'common-util/Contracts';

export const projectId = process.env.NEXT_PUBLIC_WALLET_PROJECT_ID;

export const SUPPORTED_CHAINS = [mainnet];

const walletConnectMetadata = {
  name: 'OLAS Build',
  description: 'OLAS Build Web3 Modal',
  url: 'https://build.olas.network', // origin must match your domain & subdomain
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