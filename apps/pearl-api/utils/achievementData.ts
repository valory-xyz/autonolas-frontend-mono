import type { AchievementData, AchievementQueryParams } from '../types/achievement';
import { getOmenBet } from './omenstrat';
import { getPolymarketBet } from './polystrat';

/**
 * Fetches the figures for one achievement. Null means the achievement does not
 * exist or does not qualify (>1.5x, with venue-specific settlement rules);
 * upstream errors are thrown.
 */
export const getAchievementData = async (
  params: AchievementQueryParams,
): Promise<AchievementData | null> => {
  if (params.type !== 'payout') return null;

  if (params.agent === 'polystrat') return getPolymarketBet(params.id);
  if (params.agent === 'omenstrat') return getOmenBet(params.id);

  return null;
};
