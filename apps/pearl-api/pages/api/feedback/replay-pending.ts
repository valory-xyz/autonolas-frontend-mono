import { timingSafeEqual } from 'node:crypto';
import type { NextApiRequest, NextApiResponse } from 'next';

import type { ApiErrorResponse, ReplayPendingResponse } from '../../../types';
import { listPendingPaths } from '../../../utils/blob';
import {
  FUNDING_REQUEST_SOURCE,
  SURVEY_SOURCE,
  drainPendingSource,
  hasReplayFailures,
} from '../../../utils/replayPending';

/** Constant-time comparison so the secret cannot be probed byte by byte. */
const isAuthorizedCronCall = (authorization: string | undefined, secret: string): boolean => {
  const provided = Buffer.from(authorization ?? '');
  const expected = Buffer.from(`Bearer ${secret}`);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
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

  const survey = await drainPendingSource(SURVEY_SOURCE, surveyPaths);
  const fundingRequests = await drainPendingSource(FUNDING_REQUEST_SOURCE, fundingRequestPaths);

  // A non-2xx marks the run as failed in Vercel's cron history, so a backlog that never drains is
  // visible without extra monitoring.
  const status = hasReplayFailures([survey, fundingRequests]) ? 500 : 200;
  return res.status(status).json({ ok: status === 200, ...survey, fundingRequests });
}
