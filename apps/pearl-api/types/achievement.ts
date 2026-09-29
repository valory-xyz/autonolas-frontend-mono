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

export type PredictionBetData = {
  question: string;
  position: string;
  transactionHash: string;
  betAmount: number;
  amountWon: number;
  betAmountFormatted: string;
  amountWonFormatted: string;
  multiplier: string;
  // Only Omen markets carry a thumbnail; null when there is none or the lookup failed.
  marketImageUrl: string | null;
};

// Union type of all possible achievement data
export type AchievementData = PredictionBetData;
