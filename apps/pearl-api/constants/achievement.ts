import { AgentType } from 'types';

export const GATEWAY_URL = 'https://gateway.autonolas.tech/ipfs/';

export const IPFS_CONFIG = {
  HOST: process.env.NEXT_PUBLIC_REGISTRY_URL,
  PORT: 443,
  PROTOCOL: 'https' as const,
};

export const ACHIEVEMENTS_LOOKUP_PREFIX = 'achievements-lookup';

export const VALID_AGENT_TYPES = ['polystrat', 'trader', 'agentsfun', 'optimus'] as const;

export const VALID_ACHIEVEMENT_TYPES = ['payout'] as const;

export const OG_IMAGE_CONFIG = {
  WIDTH: 1200,
  HEIGHT: 630,
};

export const AGENT_LOGO_PATH_MAPPING: Partial<Record<AgentType, string>> = {
  polystrat: '/images/polystrat-logo.png',
};
