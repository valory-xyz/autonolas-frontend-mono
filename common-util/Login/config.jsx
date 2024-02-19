import {
  EthereumClient,
  w3mConnectors,
  w3mProvider,
} from '@web3modal/ethereum';
import { configureChains, createConfig } from 'wagmi';
import { gnosis } from 'wagmi/chains';
import { SafeConnector } from 'wagmi/connectors/safe';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import { RPC_URLS } from 'common-util/Contracts';

// Example of a custom chain
export const neon = {
  id: 245_022_934,
  name: 'Neon',
  network: 'neon',
  nativeCurrency: {
    decimals: 18,
    name: 'Neon',
    symbol: 'NEON',
  },
  rpcUrls: {
    public: { http: ['https://neon-mainnet.everstake.one'] },
    default: { http: ['https://neon-proxy-mainnet.solana.p2p.org'] },
  },
  blockExplorers: {
    etherscan: { name: 'NeonScan', url: 'https://neonscan.org/' },
    default: { name: 'NeonScan', url: 'https://neonscan.org/' },
  },
  contracts: {
    multicall3: { // replace
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 11_907_934,
    },
  },
};

export const projectId = process.env.NEXT_PUBLIC_WALLET_PROJECT_ID;

export const SUPPORTED_CHAINS = [
  gnosis,
  neon,
];

const { publicClient, webSocketPublicClient, chains } = configureChains(
  SUPPORTED_CHAINS,
  [
    jsonRpcProvider({
      rpc: (chain) => ({
        http: RPC_URLS[chain.id],
      }),
    }),
    w3mProvider({ projectId }),
  ],
);

export const wagmiConfig = createConfig({
  autoConnect: true,
  logger: { warn: null },
  connectors: [
    ...w3mConnectors({
      projectId,
      version: 2, // v2 of wallet connect
      chains,
    }),
    new SafeConnector({
      chains,
      options: {
        allowedDomains: [/gnosis-safe.io$/, /app.safe.global$/],
        debug: false,
      },
    }),
  ],
  publicClient,
  webSocketPublicClient,
});

export const ethereumClient = new EthereumClient(wagmiConfig, chains);
