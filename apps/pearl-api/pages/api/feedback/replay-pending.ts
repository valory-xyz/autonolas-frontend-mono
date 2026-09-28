import { timingSafeEqual } from 'node:crypto';
import type { NextApiRequest, NextApiResponse } from 'next';

import {
  FEEDBACK_PENDING_PREFIX,
  FEEDBACK_SHEET_RANGE,
  FUNDING_REQUEST_PENDING_PREFIX,
  FUNDING_REQUEST_SHEET_RANGE,
} from '../../../constants';
import type {
  ApiErrorResponse,
  PendingFeedbackRecord,
  PendingFundingRequestRecord,
  ReplayCounts,
  ReplayPendingResponse,
  SheetCell,
} from '../../../types';
import { mapSubmissionToSheetRow, parsePendingFeedbackRecord } from '../../../utils/feedback';
import {
  mapFundingRequestToSheetRow,
  parsePendingFundingRequestRecord,
} from '../../../utils/fundingRequest';
import { appendSheetRow } from '../../../utils/googleSheets';
import {
  deletePendingRecord,
  getPendingRecord,
  listPendingPaths,
  quarantinePendingRecord,
} from '../../../utils/blob';

/** Constant-time comparison so the secret cannot be probed byte by byte. */
const isAuthorizedCronCall = (authorization: string | undefined, secret: string): boolean => {
  const provided = Buffer.from(authorization ?? '');
  const expected = Buffer.from(`Bearer ${secret}`);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
};

/** One kind of buffered record: where it waits, how to read it, and where its row goes. */
type PendingSource<T> = {
  label: string;
  prefix: string;
  range: string;
  parse: (raw: string) => T | null;
  toRow: (record: T) => SheetCell[];
};

const drain = async <T>(source: PendingSource<T>, pathnames: string[]): Promise<ReplayCounts> => {
  const counts: ReplayCounts = { replayed: 0, failed: 0, quarantined: 0, undeleted: 0 };

  for (const pathname of pathnames) {
    try {
      const read = await getPendingRecord(pathname, source.parse);

      // Vanished between the list and the read (a concurrent run took it).
      if (read.status === 'missing') continue;

      if (read.status === 'unreadable') {
        console.error(`${source.label}: quarantining unreadable pending blob ${pathname}`);
        await quarantinePendingRecord(source.prefix, pathname, read.raw);
        counts.quarantined += 1;
        continue;
      }

      await appendSheetRow(source.range, source.toRow(read.record));
      counts.replayed += 1;
    } catch (error) {
      // The blob stays for the next run.
      counts.failed += 1;
      console.error(`${source.label}: replay failed for ${pathname}:`, error);
      continue;
    }

    // Delete only after a successful append, and account for it separately: a failed delete is
    // an appended row that the next run will append again, not a failed replay.
    try {
      await deletePendingRecord(pathname);
    } catch (error) {
      counts.undeleted += 1;
      console.error(
        `${source.label}: appended ${pathname} but could not delete it; it will be replayed again:`,
        error,
      );
    }
  }

  return counts;
};

const SURVEY_SOURCE: PendingSource<PendingFeedbackRecord> = {
  label: 'Onboarding survey',
  prefix: FEEDBACK_PENDING_PREFIX,
  range: FEEDBACK_SHEET_RANGE,
  parse: parsePendingFeedbackRecord,
  toRow: (record) => mapSubmissionToSheetRow(record.submission, record.submittedAt),
};

const FUNDING_REQUEST_SOURCE: PendingSource<PendingFundingRequestRecord> = {
  label: 'Funding request',
  prefix: FUNDING_REQUEST_PENDING_PREFIX,
  range: FUNDING_REQUEST_SHEET_RANGE,
  parse: parsePendingFundingRequestRecord,
  toRow: (record) => mapFundingRequestToSheetRow(record.submission, record.submittedAt),
};

/**
 * Cron-only drain of submissions buffered after a Sheets failure: onboarding surveys and
 * funding requests. Vercel may deliver a scheduled run more than once, so a replayed row can
 * appear twice; `submissionId` lets analysis filter it.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ReplayPendingResponse | ApiErrorResponse>,
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed', message: 'Use GET' });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    // Distinct from a bad caller: with no secret configured the daily drain 401s forever.
    console.error('Feedback replay: CRON_SECRET is not configured; replay cannot run');
    return res.status(401).json({ error: 'Unauthorized', message: 'Cron secret not configured' });
  }
  if (!isAuthorizedCronCall(req.headers.authorization, cronSecret)) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid cron credentials' });
  }

  res.setHeader('Cache-Control', 'no-store, max-age=0');

  let surveyPaths: string[];
  let fundingRequestPaths: string[];
  try {
    [surveyPaths, fundingRequestPaths] = await Promise.all([
      listPendingPaths(SURVEY_SOURCE.prefix),
      listPendingPaths(FUNDING_REQUEST_SOURCE.prefix),
    ]);
  } catch (error) {
    console.error('Feedback replay: could not list pending submissions:', error);
    return res
      .status(502)
      .json({ error: 'Bad gateway', message: 'Could not list pending submissions' });
  }

  const survey = await drain(SURVEY_SOURCE, surveyPaths);
  const fundingRequests = await drain(FUNDING_REQUEST_SOURCE, fundingRequestPaths);

  // A non-2xx marks the run as failed in Vercel's cron history, so a backlog that never drains is
  // visible without extra monitoring.
  const anyFailed = [survey, fundingRequests].some((c) => c.failed > 0 || c.undeleted > 0);
  const status = anyFailed ? 500 : 200;
  return res.status(status).json({ ok: status === 200, ...survey, fundingRequests });
}
