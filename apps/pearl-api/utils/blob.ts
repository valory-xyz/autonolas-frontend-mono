import { put, list, get, del } from '@vercel/blob';

import type {
  LookupEntry,
  AchievementQueryParams,
  AchievementsLookupJson,
} from '../types/achievement';
import type { PendingFeedbackRecord, PendingRecordRead } from '../types/feedback';
import type { PendingFundingRequestRecord } from '../types/fundingRequest';
import { ACHIEVEMENTS_LOOKUP_PREFIX } from '../constants/achievement';
import {
  FEEDBACK_BLOB_CONFIG,
  FEEDBACK_PENDING_PREFIX,
  FEEDBACK_REPLAY_BATCH_SIZE,
} from '../constants/feedback';
import { FUNDING_REQUEST_PENDING_PREFIX } from '../constants/fundingRequest';

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
// Feedback pending buffer (onboarding surveys and funding requests)
//
// A submission lands here only when the Google Sheets write failed, and lives here only until
// the replay cron appends it. Unlike the achievement blobs above, these hold free text and must
// not be readable by URL, so they live in a separate *private* store (store access is fixed at
// creation) and every call passes that store's token explicitly. Each kind of record has its own
// prefix; the helpers below are shared.
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

const getPendingPath = (prefix: string, submissionId: string): string =>
  `${prefix}/${submissionId}.json`;

type PendingLocation = { prefix: string; unreadablePrefix: string };

/** `<prefix>/<id>.json` → `<unreadablePrefix>/<id>.json`. */
const getUnreadablePath = (
  { prefix, unreadablePrefix }: PendingLocation,
  pendingPathname: string,
): string => {
  // Otherwise the copy would land back on the pending path and the delete would lose the record.
  if (!pendingPathname.startsWith(`${prefix}/`)) {
    throw new Error(`${pendingPathname} is not under ${prefix}/`);
  }
  return `${unreadablePrefix}/${pendingPathname.slice(prefix.length + 1)}`;
};

/** No `allowOverwrite`: every attempt has a fresh `submissionId`, so a repeat path is a bug. */
const putPendingRecord = async (
  prefix: string,
  submissionId: string,
  record: unknown,
): Promise<void> => {
  await put(getPendingPath(prefix, submissionId), JSON.stringify(record), {
    access: 'private',
    addRandomSuffix: false,
    contentType: 'application/json',
    token: getFeedbackBlobToken(),
  });
};

export const putPendingFeedback = (record: PendingFeedbackRecord): Promise<void> =>
  putPendingRecord(FEEDBACK_PENDING_PREFIX, record.submission.submissionId, record);

export const putPendingFundingRequest = (record: PendingFundingRequestRecord): Promise<void> =>
  putPendingRecord(FUNDING_REQUEST_PENDING_PREFIX, record.submission.submissionId, record);

/** `hasMore` is set when records beyond `limit` are still pending. */
export const listPendingPaths = async (
  prefix: string,
  limit: number = FEEDBACK_REPLAY_BATCH_SIZE,
): Promise<{ pathnames: string[]; hasMore: boolean }> => {
  const { blobs, hasMore } = await list({
    prefix: `${prefix}/`,
    limit,
    token: getFeedbackBlobToken(),
  });

  return { pathnames: blobs.map((blob) => blob.pathname), hasMore };
};

/** Re-validates a buffered record; `unreadable` lets the caller quarantine it instead of retrying forever. */
export const getPendingRecord = async <T>(
  pathname: string,
  parse: (raw: string) => T | null,
): Promise<PendingRecordRead<T>> => {
  const result = await get(pathname, { access: 'private', token: getFeedbackBlobToken() });
  if (!result) return { status: 'missing' };
  if (result.statusCode !== 200 || !result.stream) {
    console.warn(`Pending blob ${pathname} not readable (status ${result.statusCode})`);
    return { status: 'missing' };
  }

  const raw = await new Response(result.stream).text();
  const record = parse(raw);

  return record ? { status: 'ok', record } : { status: 'unreadable', raw };
};

export const deletePendingRecord = async (pathname: string): Promise<void> => {
  await del(pathname, { token: getFeedbackBlobToken() });
};

/** Copies the bytes to the unreadable prefix, then deletes the original. */
export const quarantinePendingRecord = async (
  location: PendingLocation,
  pathname: string,
  raw: string,
): Promise<void> => {
  const token = getFeedbackBlobToken();
  await put(getUnreadablePath(location, pathname), raw, {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    token,
  });
  await del(pathname, { token });
};
