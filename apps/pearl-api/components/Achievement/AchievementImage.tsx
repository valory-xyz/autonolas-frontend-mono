import { ImageResponse } from '@takumi-rs/image-response';
import type { PersistentImage } from '@takumi-rs/core';

import type { AchievementData, AchievementQueryParams, AgentType } from 'types/achievement';
import { AGENT_LOGO_PATH_MAPPING, OG_IMAGE_CONFIG } from 'constants/achievement';
import { AchievementUI } from './AchievementUI';
import { getAchievementData } from 'utils/achievementData';
import { fetchMarketImage } from 'utils/marketThumbnail';

const MARKET_IMAGE_SRC = 'market';

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

const getMarketImage = async (data: AchievementData): Promise<PersistentImage | null> => {
  if (!data.marketImageUrl) return null;

  const imageData = await fetchMarketImage(data.marketImageUrl);
  return imageData ? { src: MARKET_IMAGE_SRC, data: imageData } : null;
};

/**
 * Renders the achievement card. Returns null when the achievement data is not
 * found, so the API does not generate an image.
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

  const marketImage = await getMarketImage(data);
  if (marketImage) persistentImages.push(marketImage);

  const imageResponse = new ImageResponse(
    (
      <AchievementUI
        params={params}
        logoSrc={params.agent}
        marketImageSrc={marketImage ? MARKET_IMAGE_SRC : undefined}
        data={data}
      />
    ),
    {
      width: OG_IMAGE_CONFIG.WIDTH,
      height: OG_IMAGE_CONFIG.HEIGHT,
      persistentImages,
    },
  );

  const arrayBuffer = await imageResponse.arrayBuffer();
  return Buffer.from(arrayBuffer);
};
