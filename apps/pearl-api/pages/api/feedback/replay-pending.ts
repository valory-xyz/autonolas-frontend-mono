import type { NextApiRequest, NextApiResponse } from 'next';

import { FEEDBACK_SHEET_RANGE } from '../../../constants';
import type { ApiErrorResponse, ReplayPendingResponse } from '../../../types/feedback';
import { mapSubmissionToSheetRow } from '../../../utils/feedback';
import { appendSheetRow } from '../../../utils/googleSheets';
import {
  deletePendingFeedback,
  getPendingFeedback,
  listPendingFeedbackPaths,
  quarantinePendingFeedback,
} from '../../../utils/blob';

/**
 * Drains submissions buffered by the onboarding-survey route after a Sheets failure.
 *
 * Cron-only: Vercel sends `Authorization: Bearer ${CRON_SECRET}` on scheduled invocations, and
 * anything else is rejected, so finding the URL is not enough to trigger it. No CORS — it is
 * never browser-invoked.
 *
 * Each blob is deleted only after its append succeeds; deleting first would lose the submission
 * if the append failed. Vercel documents cron delivery as best-effort and may invoke the same
 * run twice, so a replay can double-write a row — that is accepted, and `submissionId` in
 * column 2 is what lets analysis filter it.
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
  if (!cronSecret || req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid cron credentials' });
  }

  res.setHeader('Cache-Control', 'no-store, max-age=0');

  let replayed = 0;
  let failed = 0;

  try {
    const pathnames = await listPendingFeedbackPaths();

    for (const pathname of pathnames) {
      try {
        const read = await getPendingFeedback(pathname);

        // Never mappable to a row, so retrying it forever would hold a slot in every batch.
        // Set it aside instead — the bytes are kept under the unreadable prefix.
        if (read.status === 'unreadable') {
          console.error(`Onboarding survey: quarantining unreadable pending blob ${pathname}`);
          await quarantinePendingFeedback(pathname, read.raw);
          failed += 1;
          continue;
        }

        // The blob vanished between the list and the read — nothing to append or delete.
        if (read.status === 'missing') {
          failed += 1;
          continue;
        }

        const { record } = read;

        await appendSheetRow(
          FEEDBACK_SHEET_RANGE,
          mapSubmissionToSheetRow(record.submission, record.submittedAt),
        );
        await deletePendingFeedback(pathname);
        replayed += 1;
      } catch (error) {
        // One poisoned blob must not stall the batch; it is retried on the next run.
        failed += 1;
        console.error(`Onboarding survey: replay failed for ${pathname}:`, error);
      }
    }
  } catch (error) {
    console.error('Onboarding survey: could not list pending submissions:', error);
    return res
      .status(502)
      .json({ error: 'Bad gateway', message: 'Could not list pending submissions' });
  }

  return res.status(200).json({ ok: true, replayed, failed });
}
