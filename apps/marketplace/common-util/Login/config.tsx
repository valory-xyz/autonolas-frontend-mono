import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { web3 } from '@coral-xyz/anchor';
import { Cluster } from '@solana/web3.js';
import { kebabCase } from 'lodash';
import { cookieStorage, createStorage, http } from 'wagmi';
import {
  Chain,
  arbitrum,
  base,
  celo,
  gnosis,
  mainnet,
  optimism,
  polygon,
  mode,
} from 'wagmi/chains';

import { RPC_URLS } from 'libs/util-constants/src';
import { SOLANA_CHAIN_NAMES } from 'util/constants';
import { VM_TYPE } from 'libs/util-constants/src';

export const SUPPORTED_CHAINS: [Chain, ...Chain[]] = [
  mainnet,
  gnosis,
  polygon,
  arbitrum,
  base,
  optimism,
  celo,
  mode,
];

const projectId = process.env.NEXT_PUBLIC_WALLET_PROJECT_ID as string;

export const wagmiMetadata = {
  name: 'Mech Marketplace | Olas',
  description:
    'Marketplace to discover, manage, and view activity of autonomous AI agents directly from the Olas on-chain registry.',
  url: 'https://marketplace.olas.network/',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
};

// Exported so that read/write callers (common-util/Details/utils, ServiceState/utils, etc.)
// can import the same instance the WagmiProvider in pages/_app.tsx uses.
export const wagmiConfig = getDefaultConfig({
  appName: wagmiMetadata.name,
  chains: SUPPORTED_CHAINS,
  projectId,
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
  transports: SUPPORTED_CHAINS.reduce(
    (acc, chain) =>
      Object.assign(acc, { [chain.id]: http(RPC_URLS[chain.id] || chain.rpcUrls.default.http[0]) }),
    {},
  ),
});

/**
 * Returns the list of supported chains with more info such as
 * network name, network display name, etc
 * @example
 * [
 *  { name: 'Mainnet', id: 1, network: 'ethereum' },
 *  { name: 'Gnosis', id: 100, network: 'gnosis' },
 *  // ...
 * ]
 */
export const EVM_SUPPORTED_CHAINS = SUPPORTED_CHAINS.map((chain) => {
  const { name, id } = chain;

  return {
    id,
    networkDisplayName: name,
    networkName: kebabCase(name),
    vmType: VM_TYPE.EVM,
  };
});

export type SolanaChain = {
  id: number | null;
  networkDisplayName: string;
  networkName: string;
  clusterName: Cluster;
  vmType: keyof typeof VM_TYPE;
};

/**
 * Solana supported chains
 */
const SVM_SOLANA_CHAIN: SolanaChain = {
  id: null,
  networkDisplayName: 'Solana',
  networkName: SOLANA_CHAIN_NAMES.MAINNET,
  clusterName: 'mainnet-beta',
  vmType: VM_TYPE.SVM,
};

export const SVM_SUPPORTED_CHAINS: SolanaChain[] = [SVM_SOLANA_CHAIN];

const DEFAULT_SVM_CLUSTER = 'mainnet-beta';

/**
 * Get the endpoint for a given Solana network name.
 * If it's mainnet, directly return the endpoint at process.env.NEXT_PUBLIC_SOLANA_MAINNET_URL.
 * Otherwise, return web3.clusterApiUrl and pass in the devnet cluster name.
 * @param {string} networkName - The network name to get the endpoint for.
 * @returns {string} The endpoint URL associated with the network name.
 */
export const getSvmEndpoint = (networkName: string) => {
  const chain: SolanaChain | undefined = SVM_SUPPORTED_CHAINS.find(
    (c) => c.networkName === networkName,
  );

  if (chain?.networkName === SOLANA_CHAIN_NAMES.MAINNET) {
    return process.env.NEXT_PUBLIC_SOLANA_MAINNET_BETA_URL;
  }
  return chain ? web3.clusterApiUrl(chain.clusterName) : web3.clusterApiUrl(DEFAULT_SVM_CLUSTER);
};

/**
 * Returns the list of all supported chains.
 */
export const ALL_SUPPORTED_CHAINS = [...EVM_SUPPORTED_CHAINS, ...SVM_SUPPORTED_CHAINS].sort(
  (a, b) => {
    // NOTE: sort in this order only for the purpose of the dropdown
    const chainNameOrder: Chain['name'][] = [
      'Ethereum',
      'Gnosis',
      'Polygon',
      'Solana',
      'Arbitrum One',
      'Base',
      'OP Mainnet',
      'Celo',
      'Mode Mainnet',
    ];

    const aIndex = chainNameOrder.indexOf(a.networkDisplayName);
    const bIndex = chainNameOrder.indexOf(b.networkDisplayName);

    if (aIndex === bIndex) return 0;
    if (aIndex > bIndex) return 1;
    return -1;
  },
);
