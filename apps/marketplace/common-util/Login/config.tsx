import { web3 } from '@project-serum/anchor';
import { Cluster } from '@solana/web3.js';
import { kebabCase } from 'lodash';
import {
  Chain,
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  celo,
  celoAlfajores,
  gnosis,
  gnosisChiado,
  mainnet,
  optimism,
  optimismSepolia,
  polygon,
  mode,
} from 'wagmi/chains';

import { RPC_URLS } from 'common-util/Contracts';
import { SOLANA_CHAIN_NAMES } from 'util/constants';
import { VM_TYPE } from 'libs/util-constants/src';

export const SUPPORTED_CHAINS: Chain[] = [
  mainnet,
  gnosis,
  gnosisChiado,
  polygon,
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  optimism,
  optimismSepolia,
  celo,
  celoAlfajores,
  mode,
].map((chain) => {
  const defaultRpc = RPC_URLS[chain.id] || chain.rpcUrls.default.http[0];
  return {
    ...chain,
    rpcUrls: {
      ...chain.rpcUrls,
      default: { http: [defaultRpc] },
    },
  } as Chain;
});

/**
 * Returns the list of supported chains with more info such as
 * network name, network display name, etc
 * @example
 * [
 *  { name: 'Mainnet', id: 1, network: 'ethereum' },
 *  { name: 'Goerli', id: 5, network: 'goerli' },
 *  // ...
 * ]
 */
export const EVM_SUPPORTED_CHAINS = SUPPORTED_CHAINS.map((chain) => {
  const { name, id } = chain;

  const getNetworkName = () => {
    if (name === 'OP Mainnet') return 'optimism';
    if (name === 'OP Sepolia') return 'optimism-sepolia';
    if (name === 'Alfajores') return 'celo-alfajores';
    if (name === 'Mode Mainnet') return 'mode';
    return kebabCase(name);
  };

  const getNetworkDisplayName = () => {
    if (name === 'OP Mainnet') return 'Optimism';
    if (name === 'OP Sepolia') return 'Optimism Sepolia';
    if (name === 'Alfajores') return 'Celo Alfajores';
    return name;
  };

  return {
    id,
    networkDisplayName: getNetworkDisplayName(),
    networkName: getNetworkName(),
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

const SVM_SOLANA_DEVNET_CHAIN: SolanaChain = {
  id: null,
  networkDisplayName: 'Solana Devnet',
  networkName: SOLANA_CHAIN_NAMES.DEVNET,
  clusterName: 'devnet',
  vmType: 'SVM',
};

export const SVM_SUPPORTED_CHAINS: SolanaChain[] = [
  { ...SVM_SOLANA_CHAIN },
  { ...SVM_SOLANA_DEVNET_CHAIN },
];

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
      'Optimism',
      'Celo',
      'Mode Mainnet',
      'Gnosis Chiado',
      'Solana Devnet',
      'Arbitrum Sepolia',
      'Base Sepolia',
      'Optimism Sepolia',
      'Celo Alfajores',
    ];

    const aIndex = chainNameOrder.indexOf(a.networkDisplayName);
    const bIndex = chainNameOrder.indexOf(b.networkDisplayName);

    if (aIndex === bIndex) return 0;
    if (aIndex > bIndex) return 1;
    return -1;
  },
);
