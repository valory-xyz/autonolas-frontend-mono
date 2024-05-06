export const URL = {
  // pages without chain id
  DISCLAIMER: '/disclaimer',
  PAGE_NOT_FOUND: '/page-not-found',
  NOT_LEGAL: '/not-legal',
} as const;

// should not display contracts on homepage nor load with chain Ids
export const PAGES_TO_LOAD_WITHOUT_CHAINID = [
  '/disclaimer',
  '/page-not-found',
  '/not-legal',
] as const;

export const HASH_PREFIX = 'f01701220';
export const HASH_PREFIXES = {
  type1: HASH_PREFIX,
  type2: 'bafybei',
} as const;

export const GATEWAY_URL = 'https://gateway.autonolas.tech/ipfs/';

// used for local testing
export const LOCAL_FORK_ID = 100000;
export const LOCAL_FORK_ID_GNOSIS = 100001;
export const LOCAL_FORK_ID_POLYGON = 100002;

export const DEFAULT_CHAIN_ID = 1;

// TODO: move to autonolas-frontend-library
export const EXTRA_COLORS = {
  YELLOW_PRIMARY: '#eab308', // tailwind orange.500
  YELLOW_SECONDARY: '#fefce8', // tailwind orange.50
} as const;
