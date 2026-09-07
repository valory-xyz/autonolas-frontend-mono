import { put, list, get, del } from '@vercel/blob';

import type {
  LookupEntry,
  AchievementQueryParams,
  AchievementsLookupJson,
} from '../types/achievement';
import type { PendingFeedbackRecord } from '../types/feedback';
import { ACHIEVEMENTS_LOOKUP_PREFIX } from '../constants/achievement';
import { FEEDBACK_PENDING_PREFIX, FEEDBACK_REPLAY_BATCH_SIZE } from '../constants/feedback';

// New per-entry path: achievements-lookup/{agent}/{type}/{id}.json
const getEntryFileName = (agent: string, type: string, id: string): string =>
  `${ACHIEVEMENTS_LOOKUP_PREFIX}/${agent}/${type}/${id}.json`;

// Legacy monolithic path: achievements-lookup/{agent}/{type}.json
const getLegacyFileName = (agent: string, type: string): string =>
  `${ACHIEVEMENTS_LOOKUP_PREFIX}/${agent}/${type}.json`;

const getLegacyLookupJson = async (
  agent: string,
  type: string,
): Promise<AchievementsLookupJson> => {
  try {
    const fileName = getLegacyFileName(agent, type);
    const { blobs } = await list({ prefix: fileName, limit: 1 });

    if (blobs.length === 0) return {};

    const response = await fetch(blobs[0].url);

    if (!response.ok) {
      console.warn(`Failed to fetch legacy lookup json for ${agent}/${type}`);
      return {};
    }

    return (await response.json()) as AchievementsLookupJson;
  } catch (error) {
    console.error(`Error fetching legacy lookup json for ${agent}/${type}:`, error);
    return {};
  }
};

export const getLookupEntry = async (
  params: AchievementQueryParams,
): Promise<LookupEntry | null> => {
  // Try new per-entry file first
  try {
    const entryPath = getEntryFileName(params.agent, params.type, params.id);
    const { blobs } = await list({ prefix: entryPath, limit: 1 });

    if (blobs.length > 0) {
      const response = await fetch(blobs[0].url);
      if (response.ok) {
        return (await response.json()) as LookupEntry;
      } else {
        console.warn(
          `Failed to fetch per-entry blob for ${entryPath}: ${response.status} ${response.statusText}`,
        );
      }
    }
  } catch (error) {
    console.error(
      `Error fetching per-entry blob for ${params.agent}/${params.type}/${params.id}:`,
      error,
    );
  }

  // Fall back to legacy monolithic file
  const json = await getLegacyLookupJson(params.agent, params.type);
  return json[params.id] || null;
};

export const setLookupEntry = async (
  params: AchievementQueryParams,
  entry: LookupEntry,
): Promise<void> => {
  const fileName = getEntryFileName(params.agent, params.type, params.id);
  await put(fileName, JSON.stringify(entry), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
    cacheControlMaxAge: 0,
  });
};

// ---------------------------------------------------------------------------
// Onboarding-survey pending buffer
//
// A submission lands here only when the Google Sheets write failed, and lives here only until
// the replay cron appends it. Unlike the achievement blobs above, these are written with
// `access: 'private'`: they hold free-text feedback and must not be readable by URL.
// ---------------------------------------------------------------------------

const getPendingFeedbackPath = (submissionId: string): string =>
  `${FEEDBACK_PENDING_PREFIX}/${submissionId}.json`;

export const putPendingFeedback = async (record: PendingFeedbackRecord): Promise<void> => {
  await put(getPendingFeedbackPath(record.submission.submissionId), JSON.stringify(record), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  });
};

export const listPendingFeedbackPaths = async (): Promise<string[]> => {
  const { blobs } = await list({
    prefix: `${FEEDBACK_PENDING_PREFIX}/`,
    limit: FEEDBACK_REPLAY_BATCH_SIZE,
  });

  return blobs.map((blob) => blob.pathname);
};

export const getPendingFeedback = async (
  pathname: string,
): Promise<PendingFeedbackRecord | null> => {
  const result = await get(pathname, { access: 'private' });
  if (!result?.stream) return null;

  return (await new Response(result.stream).json()) as PendingFeedbackRecord;
};

export const deletePendingFeedback = async (pathname: string): Promise<void> => {
  await del(pathname);
};
