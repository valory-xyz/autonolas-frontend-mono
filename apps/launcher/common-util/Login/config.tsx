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
  goerli,
  mainnet,
  optimism,
  optimismSepolia,
  polygon,
  polygonMumbai,
} from 'wagmi/chains';

import { kebabCase } from 'lodash';

import { RPC_URLS } from 'common-util/Contracts';

export const SUPPORTED_CHAINS: Chain[] = [
  mainnet,
  goerli,
  gnosis,
  gnosisChiado,
  polygon,
  polygonMumbai,
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  optimism,
  optimismSepolia,
  celo,
  celoAlfajores,
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
  };
});

/**
 * Returns the list of all supported chains.
 */
export const ALL_SUPPORTED_CHAINS = [...EVM_SUPPORTED_CHAINS].sort((a, b) => {
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
    'Goerli',
    'Gnosis Chiado',
    'Polygon Mumbai',
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
});
