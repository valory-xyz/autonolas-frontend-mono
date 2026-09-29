import { AgentType } from 'types';

export const GATEWAY_URL = 'https://gateway.autonolas.tech/ipfs/';

export const IPFS_CONFIG = {
  HOST: process.env.NEXT_PUBLIC_REGISTRY_URL,
  PORT: 443,
  PROTOCOL: 'https' as const,
};

export const ACHIEVEMENTS_LOOKUP_PREFIX = 'achievements-lookup';

export const VALID_AGENT_TYPES = [
  'polystrat',
  'omenstrat',
  'trader',
  'agentsfun',
  'optimus',
] as const;

export const VALID_ACHIEVEMENT_TYPES = ['payout'] as const;

// Example Payout's betIDs: 0x74bfbf071a414817d27bf8d098a883a6be925425a3d5fb1ae4097f8bb0593ca498020000 (Omen,
// legacy Polymarket) and 0x90…6c07_1460 (Polymarket squid). The id is also a blob path segment, so
// `/`, `.` and whitespace must stay rejected.
export const ACHIEVEMENT_ID_PATTERN = /^[a-zA-Z0-9_]{1,100}$/;

export const OG_IMAGE_CONFIG = {
  WIDTH: 1200,
  HEIGHT: 630,
};

export const AGENT_LOGO_PATH_MAPPING: Partial<Record<AgentType, string>> = {
  polystrat: '/images/polystrat-logo.png',
  omenstrat: '/images/omenstrat-logo.png',
};

export const DEFAULT_PREDICT_OMEN_URL =
  'https://api.subgraph.autonolas.tech/api/proxy/predict-omen';

export const OMEN_THUMBNAIL_MAPPING_SUBGRAPH_ID = 'EWN14ciGK53PpUiKSm7kMWQ6G4iz3tDrRLyZ1iXMQEdu';
