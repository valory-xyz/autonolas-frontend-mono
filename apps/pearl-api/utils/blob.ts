import { put, list } from '@vercel/blob';

import type {
  LookupEntry,
  AchievementQueryParams,
  AchievementsLookupJson,
} from '../types/achievement';
import { ACHIEVEMENTS_LOOKUP_PREFIX } from '../constants/achievement';

const generateLookupKey = (params: AchievementQueryParams): string => `${params.id}`;

const getFileName = (agent: string, type: string): string =>
  `${ACHIEVEMENTS_LOOKUP_PREFIX}/${agent}/${type}.json`;

const getAchievementsLookupJson = async (
  agent: string,
  type: string,
): Promise<AchievementsLookupJson> => {
  try {
    const fileName = getFileName(agent, type);
    const { blobs } = await list({ prefix: fileName });

    if (blobs.length === 0) return {};

    const blobUrl = blobs[0].url;
    const response = await fetch(blobUrl);

    if (!response.ok) {
      console.warn(`Failed to fetch achievements lookup json for ${agent}/${type}`);
      return {};
    }

    return (await response.json()) as AchievementsLookupJson;
  } catch (error) {
    console.error(`Error fetching achievements lookup json for ${agent}/${type}:`, error);
    return {};
  }
};

export const getLookupEntry = async (
  params: AchievementQueryParams,
): Promise<LookupEntry | null> => {
  const json = await getAchievementsLookupJson(params.agent, params.type);
  const key = generateLookupKey(params);
  return json[key] || null;
};

export const setLookupEntry = async (
  params: AchievementQueryParams,
  entry: LookupEntry,
): Promise<void> => {
  const json = await getAchievementsLookupJson(params.agent, params.type);
  const key = generateLookupKey(params);

  json[key] = entry;

  const fileName = getFileName(params.agent, params.type);
  await put(fileName, JSON.stringify(json, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
    cacheControlMaxAge: 0,
  });
};
