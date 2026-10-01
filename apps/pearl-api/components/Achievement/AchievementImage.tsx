import { ImageResponse } from '@takumi-rs/image-response';
import type { PersistentImage } from '@takumi-rs/core';

import type { AchievementQueryParams, AgentType } from 'types/achievement';
import { AGENT_LOGO_PATH_MAPPING, OG_IMAGE_CONFIG } from 'constants/achievement';
import { AchievementUI } from './AchievementUI';
import { getAchievementData } from 'utils/achievementData';

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

/**
 * Renders the card when getAchievementData returns eligible figures.
 */
export const generateAchievementImage = async (
  params: AchievementQueryParams,
  origin: string,
): Promise<Buffer | null> => {
  const persistentImages = await getPersistentImages(origin, params.agent);
  const data = await getAchievementData(params);

  if (!data) {
    console.error(`Achievement data not found for agent=${params.agent}, id=${params.id}.`);
    return null;
  }

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
