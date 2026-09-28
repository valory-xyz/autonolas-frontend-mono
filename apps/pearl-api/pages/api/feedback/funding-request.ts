import type { NextApiRequest, NextApiResponse } from 'next';

import { FUNDING_REQUEST_SHEET_RANGE } from '../../../constants';
import type { ApiErrorResponse, FundingRequestResponse } from '../../../types';
import { setCorsHeaders } from '../../../utils/cors';
import { isJsonContentType } from '../../../utils/feedback';
import {
  mapFundingRequestToSheetRow,
  parseFundingRequestSubmission,
} from '../../../utils/fundingRequest';
import { appendSheetRow } from '../../../utils/googleSheets';
import { putPendingFundingRequest } from '../../../utils/blob';

/**
 * One anonymous "Other chain" / "Other token" request from Pearl's funding flow (OPE-1903):
 * Sheets append first, Blob buffer on failure (still 200), 502 only when both fail. The body is
 * an acknowledgement only. No server-side dedup.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FundingRequestResponse | ApiErrorResponse>,
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

  const submission = parseFundingRequestSubmission(req.body);
  if (!submission) {
    return res.status(400).json({
      error: 'Bad request',
      message: 'One or more request fields is missing or invalid',
    });
  }

  // Server-side: a client clock is not trustworthy, and a timestamp is not identifying.
  const submittedAt = new Date().toISOString();

  res.setHeader('Cache-Control', 'no-store, max-age=0');

  try {
    await appendSheetRow(
      FUNDING_REQUEST_SHEET_RANGE,
      mapFundingRequestToSheetRow(submission, submittedAt),
    );
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Funding request: Sheets append failed, buffering to Blob:', error);
  }

  try {
    await putPendingFundingRequest({ submittedAt, submission });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Funding request: Blob fallback failed:', error);
    return res.status(502).json({ error: 'Bad gateway', message: 'Could not record the request' });
  }
}
