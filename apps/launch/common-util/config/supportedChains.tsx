import { kebabCase } from 'lodash';
import { Chain } from 'wagmi/chains';
import { SUPPORTED_CHAINS } from './wagmi';

export const PAGES_TO_LOAD_WITHOUT_CHAINID = ['disclaimer'];

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
  };
});

/**
 * Returns the list of all supported chains.
 */
export const ALL_SUPPORTED_CHAINS = [...EVM_SUPPORTED_CHAINS].sort((a, b) => {
  // NOTE: sort in this order only for the purpose of the dropdown
  const chainNameOrder: Chain['name'][] = ['Ethereum', 'Gnosis', 'Gnosis Chiado'];

  const aIndex = chainNameOrder.indexOf(a.networkDisplayName);
  const bIndex = chainNameOrder.indexOf(b.networkDisplayName);

  if (aIndex === bIndex) return 0;
  if (aIndex > bIndex) return 1;
  return -1;
});
