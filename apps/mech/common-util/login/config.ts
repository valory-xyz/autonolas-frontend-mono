import { defaultWagmiConfig } from '@web3modal/wagmi';
import { kebabCase } from 'lodash';
import { cookieStorage, createStorage, http } from 'wagmi';
import { Chain, base, gnosis } from 'wagmi/chains';
import { RPC_URLS } from 'libs/util-constants/src';

export const projectId = process.env.NEXT_PUBLIC_WALLET_PROJECT_ID || '';

export const SUPPORTED_CHAINS: [Chain, ...Chain[]] = [gnosis, base];

export const METADATA = {
  name: 'Olas Mech',
  description: 'Manage your mechs and instruct them',
  url: 'https://mech.olas.network/',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
};

export const wagmiConfig = defaultWagmiConfig({
  chains: SUPPORTED_CHAINS,
  projectId,
  metadata: METADATA,
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
  transports: SUPPORTED_CHAINS.reduce(
    (acc, chain) => Object.assign(acc, { [chain.id]: http(RPC_URLS[chain.id]) }),
    {},
  ),
});

/**
 * Returns the list of supported chains with more info such as
 * network name, network display name, etc
 * @example
 * [
 *  { name: 'Mainnet', id: 1, network: 'ethereum' }
 *  // ...
 * ]
 */
const SUPPORTED_CHAINS_LIST = SUPPORTED_CHAINS.map((chain) => {
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
export const ALL_SUPPORTED_CHAINS = [...SUPPORTED_CHAINS_LIST].sort((a, b) => {
  // NOTE: sort in this order only for the purpose of the dropdown
  const chainOrder = ['gnosis', 'base'];

  const aIndex = chainOrder.indexOf(a.networkName);
  const bIndex = chainOrder.indexOf(b.networkName);

  if (aIndex === bIndex) return 0;
  if (aIndex > bIndex) return 1;
  return -1;
});

export const FIRST_SUPPORTED_CHAIN = ALL_SUPPORTED_CHAINS[0];
