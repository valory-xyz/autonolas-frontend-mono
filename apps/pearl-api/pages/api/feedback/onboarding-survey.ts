import type { NextApiRequest, NextApiResponse } from 'next';

import { FEEDBACK_SHEET_RANGE } from '../../../constants';
import type { ApiErrorResponse, OnboardingSurveyResponse } from '../../../types';
import { setCorsHeaders } from '../../../utils/cors';
import {
  isJsonContentType,
  mapSubmissionToSheetRow,
  parseOnboardingSurveySubmission,
} from '../../../utils/feedback';
import { appendSheetRow } from '../../../utils/googleSheets';
import { putPendingFeedback } from '../../../utils/blob';

/**
 * One anonymous post-setup questionnaire submission (OPE-1899): Sheets append first, Blob buffer
 * on failure (still 200), 502 only when both fail. No server-side dedup.
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

  if (!isJsonContentType(req.headers['content-type'])) {
    return res
      .status(400)
      .json({ error: 'Bad request', message: 'Content-Type must be application/json' });
  }

  // A body that is not valid JSON never reaches this point: Next's body parser rejects it with
  // its own 400 before the handler runs (and therefore without the CORS headers set above).
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
