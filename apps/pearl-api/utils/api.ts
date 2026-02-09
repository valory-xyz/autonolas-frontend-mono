import { NextApiRequest } from 'next';
import { AchievementQueryParams, AchievementType, AgentType } from 'types';
import { ACHIEVEMENT_ID_PATTERN, VALID_ACHIEVEMENT_TYPES, VALID_AGENT_TYPES } from '../constants';

export const parseAchievementApiQueryParams = (
  query: NextApiRequest['query'],
): AchievementQueryParams | null => {
  const { agent, type, id } = query;

  const agentStr = Array.isArray(agent) ? agent[0] : agent;
  const typeStr = Array.isArray(type) ? type[0] : type;
  const idStr = Array.isArray(id) ? id[0] : id;

  if (!agentStr || !typeStr || !idStr) return null;

  if (!ACHIEVEMENT_ID_PATTERN.test(idStr)) return null;

  if (!VALID_AGENT_TYPES.includes(agentStr as AgentType)) return null;
  if (!VALID_ACHIEVEMENT_TYPES.includes(typeStr as AchievementType)) return null;

  return {
    agent: agentStr as AgentType,
    type: typeStr as AchievementType,
    id: idStr,
  };
};
