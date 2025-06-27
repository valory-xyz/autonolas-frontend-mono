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
  PAGE_NOT_FOUND: 'page-not-found',
};

export const HASH_PREFIX = 'f01701220';
export const HASH_PREFIXES = {
  type1: HASH_PREFIX,
  type2: 'bafybei',
};

export const UNICODE_SYMBOLS = {
  EXTERNAL_LINK: '↗',
  BULLET: '•',
};

export const GATEWAY_URL = 'https://gateway.autonolas.tech/ipfs/';

export const DEFAULT_MECH_CONTRACT_ADDRESS = '0x77af31De935740567Cf4fF1986D04B2c964A786a';
export const DEFAULT_AGENT_ID = '3';

export const REGISTRY_URL = 'https://registry.olas.network';

export const EXTRA_COLORS = {
  YELLOW_PRIMARY: '#eab308', // tailwind orange.500
  YELLOW_SECONDARY: '#fefce8', // tailwind orange.50
} as const;

export const PAGES_TO_LOAD_WITHOUT_CHAIN_ID = [URL.PAGE_NOT_FOUND].map((item) => `/${item}`);
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
  [gnosis.id]: 'https://gnosisscan.io',
  [base.id]: 'https://basescan.org',
} as const;

export const SCAN_IMAGES: Record<Network, string> = {
  [gnosis.id]: '/images/gnosisscan-logo.svg',
  [base.id]: '/images/basescan-logo.svg',
} as const;

export const PAYMENT_TYPES: Record<string, { isToken: boolean; isNVM: boolean }> = {
  '0xba699a34be8fe0e7725e93dcbce1701b0211a8ca61330aaeb8a05bf2ec7abed1': {
    isToken: false,
    isNVM: false,
  },
  '0x3679d66ef546e66ce9057c4a052f317b135bc8e8c509638f7966edfd4fcf45e9': {
    isToken: true,
    isNVM: false,
  },
  '0x803dd08fe79d91027fc9024e254a0942372b92f3ccabc1bd19f4a5c2b251c316': {
    isToken: false,
    isNVM: true,
  },
  '0x0d6fd99afa9c4c580fab5e341922c2a5c4b61d880da60506193d7bf88944dd14': {
    isToken: true,
    isNVM: true,
  },
} as const;
