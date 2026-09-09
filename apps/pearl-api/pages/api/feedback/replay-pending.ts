import { timingSafeEqual } from 'node:crypto';
import type { NextApiRequest, NextApiResponse } from 'next';

import { FEEDBACK_SHEET_RANGE } from '../../../constants';
import type { ApiErrorResponse, ReplayPendingResponse } from '../../../types';
import { mapSubmissionToSheetRow } from '../../../utils/feedback';
import { appendSheetRow } from '../../../utils/googleSheets';
import {
  deletePendingFeedback,
  getPendingFeedback,
  listPendingFeedbackPaths,
  quarantinePendingFeedback,
} from '../../../utils/blob';

/** Constant-time comparison so the secret cannot be probed byte by byte. */
const isAuthorizedCronCall = (authorization: string | undefined, secret: string): boolean => {
  const provided = Buffer.from(authorization ?? '');
  const expected = Buffer.from(`Bearer ${secret}`);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
};

/**
 * Cron-only drain of submissions buffered after a Sheets failure. Vercel may deliver a scheduled
 * run more than once, so a replayed row can appear twice; `submissionId` lets analysis filter it.
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
    console.error('Onboarding survey: CRON_SECRET is not configured; replay cannot run');
    return res.status(401).json({ error: 'Unauthorized', message: 'Cron secret not configured' });
  }
  if (!isAuthorizedCronCall(req.headers.authorization, cronSecret)) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid cron credentials' });
  }

  res.setHeader('Cache-Control', 'no-store, max-age=0');

  let replayed = 0;
  let failed = 0;
  let quarantined = 0;
  let undeleted = 0;

  try {
    const pathnames = await listPendingFeedbackPaths();

    for (const pathname of pathnames) {
      try {
        const read = await getPendingFeedback(pathname);

        // Vanished between the list and the read (a concurrent run took it).
        if (read.status === 'missing') continue;

        if (read.status === 'unreadable') {
          console.error(`Onboarding survey: quarantining unreadable pending blob ${pathname}`);
          await quarantinePendingFeedback(pathname, read.raw);
          quarantined += 1;
          continue;
        }

        const { record } = read;
        await appendSheetRow(
          FEEDBACK_SHEET_RANGE,
          mapSubmissionToSheetRow(record.submission, record.submittedAt),
        );
        replayed += 1;
      } catch (error) {
        // The blob stays for the next run.
        failed += 1;
        console.error(`Onboarding survey: replay failed for ${pathname}:`, error);
        continue;
      }

      // Delete only after a successful append, and account for it separately: a failed delete is
      // an appended row that the next run will append again, not a failed replay.
      try {
        await deletePendingFeedback(pathname);
      } catch (error) {
        undeleted += 1;
        console.error(
          `Onboarding survey: appended ${pathname} but could not delete it; it will be replayed again:`,
          error,
        );
      }
    }
  } catch (error) {
    console.error('Onboarding survey: could not list pending submissions:', error);
    return res
      .status(502)
      .json({ error: 'Bad gateway', message: 'Could not list pending submissions' });
  }

  // A non-2xx marks the run as failed in Vercel's cron history, so a backlog that never drains is
  // visible without extra monitoring.
  const status = failed > 0 || undeleted > 0 ? 500 : 200;
  return res.status(status).json({ ok: status === 200, replayed, failed, quarantined, undeleted });
}
