import { ImageResponse } from '@takumi-rs/image-response';
import type { PersistentImage } from '@takumi-rs/core';

import type { AchievementQueryParams } from '../../types/achievement';
import { OG_IMAGE_CONFIG } from '../../constants/achievement';
import { AchievementUI } from './AchievementUI';

const getPersistentImages = async (origin: string): Promise<PersistentImage[]> => {
  const logoUrl = `${origin}/images/polystrat-logo.png`;
  const logoResponse = await fetch(logoUrl);
  const logoArrayBuffer = await logoResponse.arrayBuffer();

  const persistentImages: PersistentImage[] = [
    {
      src: 'polystrat-logo',
      data: logoArrayBuffer,
    },
  ];
  return persistentImages;
};

export const generateAchievementImage = async (
  params: AchievementQueryParams,
  origin: string,
): Promise<Buffer> => {
  const persistentImages = await getPersistentImages(origin);

  const imageResponse = new ImageResponse(
    <AchievementUI params={params} logoSrc="polystrat-logo" />,
    {
      width: OG_IMAGE_CONFIG.WIDTH,
      height: OG_IMAGE_CONFIG.HEIGHT,
      persistentImages,
    },
  );

  const arrayBuffer = await imageResponse.arrayBuffer();
  return Buffer.from(arrayBuffer);
};
