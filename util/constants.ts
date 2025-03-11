import { base, gnosis } from 'wagmi/chains';

import { Network } from 'types/index';

export const LOCAL_CHAIN_ID = 31337;

export const NAV_TYPES = {
  AGENT: 'agent',
  SERVICE: 'service',
  OPERATOR: 'operator',
};

export const TOTAL_VIEW_COUNT = 10;

export const URL = {
  MECHS: 'mechs',
  MECHS_LEGACY: 'mechs?legacy=true',
  MECH: 'mech',
  FACTORY: 'factory',
  DOCS: 'docs',
  PAGE_NOT_FOUND: 'page-not-found',
};

export const HASH_PREFIX = 'f01701220';
export const HASH_PREFIXES = {
  type1: HASH_PREFIX,
  type2: 'bafybei',
};

export const GATEWAY_URL = 'https://gateway.autonolas.tech/ipfs/';

export const DEFAULT_MECH_CONTRACT_ADDRESS = '0x77af31De935740567Cf4fF1986D04B2c964A786a';
export const DEFAULT_AGENT_ID = '3';

export const REGISTRY_URL = 'https://registry.olas.network';

export const EXTRA_COLORS = {
  YELLOW_PRIMARY: '#eab308', // tailwind orange.500
  YELLOW_SECONDARY: '#fefce8', // tailwind orange.50
} as const;

export const PAGES_TO_LOAD_WITHOUT_CHAIN_ID = [URL.DOCS, URL.PAGE_NOT_FOUND].map(
  (item) => `/${item}`,
);
export const PAGES_TO_LOAD_WITH_CHAIN_ID = [URL.MECHS, URL.MECHS_LEGACY, URL.MECH, URL.FACTORY].map(
  (item) => `/${item}`,
);

export const MECH_MARKETPLACE_SUBGRAPH_URLS: Record<Network, string> = {
  [gnosis.id]: process.env.NEXT_PUBLIC_MECH_MARKETPLACE_GNOSIS_SUBGRAPH_URL || '',
  [base.id]: process.env.NEXT_PUBLIC_MECH_MARKETPLACE_BASE_SUBGRAPH_URL || '',
} as const;

export const WEBSOCKET_URLS: Record<Network, string> = {
  [gnosis.id]: process.env.NEXT_PUBLIC_GNOSIS_WEB_SOCKET || '',
  [base.id]: process.env.NEXT_PUBLIC_BASE_WEB_SOCKET || '',
} as const;

export const SCAN_URLS: Record<Network, string> = {
  [gnosis.id]: 'https://gnosisscan.io/',
  [base.id]: 'https://basescan.org',
} as const;
