import { VALID_ACHIEVEMENT_TYPES, VALID_AGENT_TYPES } from '../constants';

export type AgentType = (typeof VALID_AGENT_TYPES)[number];

export type AchievementType = (typeof VALID_ACHIEVEMENT_TYPES)[number];

export type AchievementQueryParams = {
  agent: AgentType;
  type: AchievementType;
  id: string;
};

export type LookupEntry = {
  ipfsHash: string;
  ipfsUrl: string;
  createdAt: number;
};

export type AchievementsLookupJson = {
  [key: string]: LookupEntry;
};
