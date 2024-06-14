import { kebabCase } from 'lodash';
import { Chain, gnosis, gnosisChiado, mainnet, polygon, polygonMumbai } from 'wagmi/chains';

import { VM_TYPE } from '@autonolas/frontend-library';

import { RPC_URLS } from 'common-util/constants/rpcs';

export const PAGES_TO_LOAD_WITHOUT_CHAINID = ['disclaimer'];

export const SUPPORTED_CHAINS: Chain[] = [
  mainnet,
  gnosis,
  gnosisChiado,
  polygon,
  polygonMumbai,
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

  return {
    id,
    networkDisplayName: name,
    networkName: kebabCase(name),
    vmType: VM_TYPE.EVM,
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
    'Gnosis Chiado',
    'Polygon Mumbai',
  ];

  const aIndex = chainNameOrder.indexOf(a.networkDisplayName);
  const bIndex = chainNameOrder.indexOf(b.networkDisplayName);

  if (aIndex === bIndex) return 0;
  if (aIndex > bIndex) return 1;
  return -1;
});
