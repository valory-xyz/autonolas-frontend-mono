import { put, list, get, del } from '@vercel/blob';

import type {
  LookupEntry,
  AchievementQueryParams,
  AchievementsLookupJson,
} from '../types/achievement';
import type { PendingFeedbackRead, PendingFeedbackRecord } from '../types/feedback';
import { ACHIEVEMENTS_LOOKUP_PREFIX } from '../constants/achievement';
import {
  FEEDBACK_PENDING_PREFIX,
  FEEDBACK_REPLAY_BATCH_SIZE,
  FEEDBACK_UNREADABLE_PREFIX,
} from '../constants/feedback';
import { parseOnboardingSurveySubmission } from './feedback';

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

/**
 * Reads a buffered submission and re-validates it instead of asserting its shape.
 *
 * The only writer is `putPendingFeedback` with an already-validated submission, so `unreadable`
 * should not happen. It matters anyway: the replay lists a bounded batch by prefix with no
 * cursor, so a blob that can never be mapped to a row would consume a slot on every subsequent
 * run. Telling the caller *why* the read failed is what lets it retry a transient failure and
 * set the rest aside.
 */
export const getPendingFeedback = async (pathname: string): Promise<PendingFeedbackRead> => {
  const result = await get(pathname, { access: 'private' });
  if (!result?.stream) return { status: 'missing' };

  const raw = await new Response(result.stream).text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: 'unreadable', raw };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { status: 'unreadable', raw };
  }

  const { submittedAt, submission } = parsed as Record<string, unknown>;
  const validated = parseOnboardingSurveySubmission(submission);

  if (typeof submittedAt !== 'string' || !submittedAt || !validated) {
    return { status: 'unreadable', raw };
  }

  return { status: 'ok', record: { submittedAt, submission: validated } };
};

export const deletePendingFeedback = async (pathname: string): Promise<void> => {
  await del(pathname);
};

/**
 * Moves a blob the replay can never turn into a row out of the pending prefix.
 *
 * The bytes are copied verbatim before the original is deleted, so nothing a user wrote is thrown
 * away — it just stops holding a slot in every batch. Anything landing under this prefix is a bug
 * in the writer and worth looking at by hand.
 */
export const quarantinePendingFeedback = async (pathname: string, raw: string): Promise<void> => {
  const fileName = pathname.startsWith(`${FEEDBACK_PENDING_PREFIX}/`)
    ? pathname.slice(`${FEEDBACK_PENDING_PREFIX}/`.length)
    : pathname;

  await put(`${FEEDBACK_UNREADABLE_PREFIX}/${fileName}`, raw, {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  });
  await del(pathname);
};
