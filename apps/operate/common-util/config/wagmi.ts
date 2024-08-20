import { createConfig, http } from 'wagmi';
import { Chain, mainnet } from 'wagmi/chains';
import { coinbaseWallet, injected, safe, walletConnect } from 'wagmi/connectors';

export const SUPPORTED_CHAINS: [Chain, ...Chain[]] = [mainnet];

export const RPC_URLS: Record<number, string> = {
  1: process.env.NEXT_PUBLIC_MAINNET_URL ?? mainnet.rpcUrls.default.http[0],
};

const walletConnectMetadata = {
  name: 'Olas Operate',
  description: 'OLAS Operate Web3 Modal',
  url: 'https://operate.olas.network',
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
    // TODO: merge two sources of RPCs into one?
    (acc, chain) => Object.assign(acc, { [chain.id]: http(RPC_URLS[chain.id]) }),
    {},
  ),
});
