import { put, list, get, del } from '@vercel/blob';

import type {
  LookupEntry,
  AchievementQueryParams,
  AchievementsLookupJson,
} from '../types/achievement';
import type { PendingFeedbackRead, PendingFeedbackRecord } from '../types/feedback';
import { ACHIEVEMENTS_LOOKUP_PREFIX } from '../constants/achievement';
import {
  FEEDBACK_BLOB_CONFIG,
  FEEDBACK_PENDING_PREFIX,
  FEEDBACK_REPLAY_BATCH_SIZE,
  FEEDBACK_UNREADABLE_PREFIX,
} from '../constants/feedback';
import { parsePendingFeedbackRecord } from './feedback';

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
    // Required since @vercel/blob 2.x: `put` throws on an existing pathname unless overwriting
    // is opted into, and this path is deterministic. Two concurrent generations of the same
    // entry, or a re-generation after an unreadable blob, must still replace it rather than 500.
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 0,
  });
};

// ---------------------------------------------------------------------------
// Onboarding-survey pending buffer
//
// A submission lands here only when the Google Sheets write failed, and lives here only until
// the replay cron appends it. Unlike the achievement blobs above, these hold free-text feedback
// and must not be readable by URL, so they live in a separate *private* store (store access is
// fixed at creation) and every call passes that store's token explicitly.
// ---------------------------------------------------------------------------

const getFeedbackBlobToken = (): string => {
  const token = FEEDBACK_BLOB_CONFIG.READ_WRITE_TOKEN;
  if (!token) {
    // Fail loudly: without the explicit token the SDK would fall back to the achievements
    // store's credentials and write free text to a public store.
    throw new Error('FEEDBACK_BLOB_READ_WRITE_TOKEN is not configured');
  }
  return token;
};

const getPendingFeedbackPath = (submissionId: string): string =>
  `${FEEDBACK_PENDING_PREFIX}/${submissionId}.json`;

/** `feedback/pending/<id>.json` → `feedback/unreadable/<id>.json`. */
const getUnreadableFeedbackPath = (pendingPathname: string): string =>
  pendingPathname.replace(`${FEEDBACK_PENDING_PREFIX}/`, `${FEEDBACK_UNREADABLE_PREFIX}/`);

/** No `allowOverwrite`: every attempt has a fresh `submissionId`, so a repeat path is a bug. */
export const putPendingFeedback = async (record: PendingFeedbackRecord): Promise<void> => {
  await put(getPendingFeedbackPath(record.submission.submissionId), JSON.stringify(record), {
    access: 'private',
    addRandomSuffix: false,
    contentType: 'application/json',
    token: getFeedbackBlobToken(),
  });
};

export const listPendingFeedbackPaths = async (): Promise<string[]> => {
  const { blobs } = await list({
    prefix: `${FEEDBACK_PENDING_PREFIX}/`,
    limit: FEEDBACK_REPLAY_BATCH_SIZE,
    token: getFeedbackBlobToken(),
  });

  return blobs.map((blob) => blob.pathname);
};

/** Re-validates a buffered submission; `unreadable` lets the caller quarantine it instead of retrying forever. */
export const getPendingFeedback = async (pathname: string): Promise<PendingFeedbackRead> => {
  const result = await get(pathname, { access: 'private', token: getFeedbackBlobToken() });
  if (result?.statusCode !== 200 || !result.stream) return { status: 'missing' };

  const raw = await new Response(result.stream).text();
  const record = parsePendingFeedbackRecord(raw);

  return record ? { status: 'ok', record } : { status: 'unreadable', raw };
};

export const deletePendingFeedback = async (pathname: string): Promise<void> => {
  await del(pathname, { token: getFeedbackBlobToken() });
};

/** Copies the bytes to the unreadable prefix, then deletes the original. */
export const quarantinePendingFeedback = async (pathname: string, raw: string): Promise<void> => {
  const token = getFeedbackBlobToken();
  await put(getUnreadableFeedbackPath(pathname), raw, {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    token,
  });
  await del(pathname, { token });
};
