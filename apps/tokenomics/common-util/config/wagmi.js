import { http, createConfig } from 'wagmi';
import { mainnet, goerli } from 'wagmi/chains';
import {
  safe,
  walletConnect,
  injected,
  coinbaseWallet,
} from 'wagmi/connectors';
import { RPC_URLS } from 'common-util/constants/rpcs';

export const SUPPORTED_CHAINS = [mainnet, goerli];

const walletConnectMetadata = {
  name: 'OLAS Tokenomics',
  description: 'OLAS Tokenomics Web3 Modal',
  url: 'https://tokenomics.olas.network', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
};

export const wagmiConfig = createConfig({
  autoConnect: true,
  chains: SUPPORTED_CHAINS,
  options: {
    rpc: SUPPORTED_CHAINS.reduce(
      (acc, chain) => Object.assign(acc, { [chain.id]: RPC_URLS[chain.id] }),
      {},
    ),
  },
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLET_PROJECT_ID,
      metadata: walletConnectMetadata,
      showQrModal: false,
    }),
    safe(),
    coinbaseWallet({
      appName: 'OLAS Tokenomics',
    }),
  ],
  transports: SUPPORTED_CHAINS.reduce(
    (acc, chain) =>
      Object.assign(acc, { [chain.id]: http(RPC_URLS[chain.id]) }),
    {},
  ),
});
