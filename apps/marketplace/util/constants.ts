export const URL = {
  AGENTS: '/agent-blueprints',
  COMPONENTS: '/components',
  SERVICES: '/ai-agents',
  MINT_AGENT: '/agent-blueprints/mint',
  MINT_COMPONENT: '/components/mint',
  MINT_SERVICE: '/ai-agents/mint',
  UPDATE_SERVICE: '/ai-agents/update',

  // pages without chain id
  PAGE_NOT_FOUND: '/page-not-found',
  NOT_LEGAL: '/not-legal',
} as const;

export const NAV_TYPES = {
  COMPONENT: 'component',
  AGENT_BLUEPRINTS: 'agent-blueprints',
  AI_AGENTS: 'ai-agents',
} as const;

export type NavTypesKeys = keyof typeof NAV_TYPES;
export type NavTypesValues = (typeof NAV_TYPES)[NavTypesKeys];

export const SERVICE_STATE = {
  0: 'Non Existent',
  1: 'Pre Registration',
  2: 'Active Registration',
  3: 'Finished Registration',
  4: 'Deployed',
  5: 'Terminated Bonded',
} as const;

export const SERVICE_ROLE = {
  REGISTERED: 'Registered',
  DEMAND_AND_SUPPLY: 'Demand & Supply',
  DEMAND: 'Demand',
  SUPPLY: 'Supply',
};

export const SERVICE_STATE_KEY_MAP = {
  nonExistent: '0',
  preRegistration: '1',
  activeRegistration: '2',
  finishedRegistration: '3',
  deployed: '4',
  terminatedBonded: '5',
} as const;

// should not display contracts on homepage nor load with chain Ids
export const PAGES_TO_LOAD_WITHOUT_CHAINID = ['/page-not-found', '/not-legal'] as const;

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

export const DEFAULT_CHAIN_ID = 1;

/**
 * Constants for Solana chain names
 */
export const SOLANA_CHAIN_NAMES = {
  MAINNET: 'solana',
} as const;

/**
 * Constants for the different types of Hash Details states
 */
export const HASH_DETAILS_STATE = {
  IS_LOADING: 'IS_LOADING',
  LOADED: 'LOADED',
  FAILED: 'FAILED',
} as const;

export const CACHE_DURATION = {
  FIVE_MINUTES: 300,
  HALF_HOUR: 1800,
  ONE_HOUR: 3600,
  SIX_HOURS: 21600,
  TWELVE_HOURS: 43200,
} as const;

export const MARKETPLACE_SUPPORTED_CHAIN_IDS = [10, 100, 137, 8453];
