import BigNumber from "bignumber.js";

export const URL = {
  AGENTS: '/agents',
  COMPONENTS: '/components',
  SERVICES: '/services',
  MINT_AGENT: '/agents/mint',
  MINT_COMPONENT: '/components/mint',
  MINT_SERVICE: '/services/mint',
  UPDATE_SERVICE: '/services/update',

  // pages without chain id
  DISCLAIMER: '/disclaimer',
  PAGE_NOT_FOUND: '/page-not-found',
  NOT_LEGAL: '/not-legal',
} as const;

export const SERVICE_STATE = {
  0: 'Non Existent',
  1: 'Pre Registration',
  2: 'Active Registration',
  3: 'Finished Registration',
  4: 'Deployed',
  5: 'Terminated Bonded',
} as const;

export const SERVICE_STATE_KEY_MAP = {
  nonExistent: '0',
  preRegistration: '1',
  activeRegistration: '2',
  finishedRegistration: '3',
  deployed: '4',
  terminatedBonded: '5',
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

// max components/agents/service to be shown in a single view
export const TOTAL_VIEW_COUNT = 10;

export const DEFAULT_SERVICE_CREATION_ETH_TOKEN = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export const DEFAULT_SERVICE_CREATION_ETH_TOKEN_ZEROS =
  '0x0000000000000000000000000000000000000000';

export const SVM_EMPTY_ADDRESS = '11111111111111111111111111111111';

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

// These constants define the types of virtual machines supported
export const VM_TYPE = {
  EVM: 'EVM', // Ethereum Virtual Machine
  SVM: 'SVM', // Solana Virtual Machine
} as const;

/**
 * Constants for Solana chain names
 */
export const SOLANA_CHAIN_NAMES = {
  MAINNET: 'solana',
  DEVNET: 'solana-devnet',
} as const;




/**
 * Enum for Tokenomics units
 */
export const TOKENOMICS_UNITS = {
  COMPONENT: BigNumber(0),
  AGENT: BigNumber(1),
} as const
