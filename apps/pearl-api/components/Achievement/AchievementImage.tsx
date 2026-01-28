import { ImageResponse } from '@takumi-rs/image-response';
import type { PersistentImage } from '@takumi-rs/core';

import type { AchievementData, AchievementQueryParams, AgentType } from 'types/achievement';
import { AGENT_LOGO_PATH_MAPPING, OG_IMAGE_CONFIG } from 'constants/achievement';
import { AchievementUI } from './AchievementUI';
import { getPolymarketBet } from 'utils/polymarket';

/**
 * Fetches the achievement data based on the agent type.
 * @returns The achievement data or null if not found. Null ensures
 * that the API throws an error and that the image is not generated.
 */
const getAchievementData = async (
  params: AchievementQueryParams,
): Promise<AchievementData | null> => {
  if (params.agent === 'polystrat' && params.type === 'payout') {
    try {
      const data = await getPolymarketBet(params.id);

      if (!data) {
        console.error('Polymarket bet data not found or invalid.');
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching Polymarket bet:', error);
      throw error;
    }
  }

  return null;
};

const getPersistentImages = async (
  origin: string,
  agent: AgentType,
): Promise<PersistentImage[]> => {
  const logoPath = AGENT_LOGO_PATH_MAPPING[agent];

  if (!logoPath) {
    throw new Error(`No logo path found for agent: ${agent}`);
  }

  const response = await fetch(`${origin}${logoPath}`);
  const arrayBuffer = await response.arrayBuffer();

  return [
    {
      src: agent,
      data: arrayBuffer,
    },
  ];
};

export const generateAchievementImage = async (
  params: AchievementQueryParams,
  origin: string,
): Promise<Buffer | null> => {
  const persistentImages = await getPersistentImages(origin, params.agent);
  const data = await getAchievementData(params);

  if (!data) return null;

  const imageResponse = new ImageResponse(
    <AchievementUI params={params} logoSrc={params.agent} data={data} />,
    {
      width: OG_IMAGE_CONFIG.WIDTH,
      height: OG_IMAGE_CONFIG.HEIGHT,
      persistentImages,
    },
  );

  const arrayBuffer = await imageResponse.arrayBuffer();
  return Buffer.from(arrayBuffer);
};
