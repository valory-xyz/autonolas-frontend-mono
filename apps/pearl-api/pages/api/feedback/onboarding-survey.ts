import type { NextApiRequest, NextApiResponse } from 'next';

import { FEEDBACK_SHEET_RANGE } from '../../../constants';
import type { ApiErrorResponse, OnboardingSurveyResponse } from '../../../types/feedback';
import { setCorsHeaders } from '../../../utils/cors';
import { mapSubmissionToSheetRow, parseOnboardingSurveySubmission } from '../../../utils/feedback';
import { appendSheetRow } from '../../../utils/googleSheets';
import { putPendingFeedback } from '../../../utils/blob';

const isJsonContentType = (req: NextApiRequest): boolean => {
  const contentType = req.headers['content-type'];
  return typeof contentType === 'string' && contentType.split(';')[0].trim() === 'application/json';
};

/**
 * Receives one anonymous post-setup questionnaire submission from Pearl (OPE-1899) and appends
 * it to the configured Google Sheet.
 *
 * Delivery is two-tier so a Google outage stays invisible to the user: the Sheets append is
 * primary, and any failure falls through to a Blob buffer that the replay cron drains later.
 * The caller still gets 200 in that case and treats the submission as complete. 502 is returned
 * only when both tiers fail — that is the one case where Pearl keeps its sidebar nudge.
 *
 * There is no server-side dedup, so the caller must not auto-retry a 2xx; `submissionId` exists
 * so any duplicate row can be filtered during analysis.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OnboardingSurveyResponse | ApiErrorResponse>,
) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed', message: 'Use POST' });
  }

  if (!isJsonContentType(req)) {
    return res
      .status(400)
      .json({ error: 'Bad request', message: 'Content-Type must be application/json' });
  }

  const submission = parseOnboardingSurveySubmission(req.body);
  if (!submission) {
    return res.status(400).json({
      error: 'Bad request',
      message: 'One or more submission fields is missing or invalid',
    });
  }

  // Server-side: a client clock is not trustworthy, and a timestamp is not identifying.
  const submittedAt = new Date().toISOString();

  res.setHeader('Cache-Control', 'no-store, max-age=0');

  try {
    await appendSheetRow(FEEDBACK_SHEET_RANGE, mapSubmissionToSheetRow(submission, submittedAt));
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Onboarding survey: Sheets append failed, buffering to Blob:', error);
  }

  try {
    await putPendingFeedback({ submittedAt, submission });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Onboarding survey: Blob fallback failed:', error);
    return res
      .status(502)
      .json({ error: 'Bad gateway', message: 'Could not record the submission' });
  }
}
