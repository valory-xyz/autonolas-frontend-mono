import {
  FUNDING_REQUEST_CONTEXT_CHAIN_MAX_LENGTH,
  FUNDING_REQUEST_KINDS,
  FUNDING_REQUEST_NAME_MAX_LENGTH,
  FUNDING_REQUEST_SHEET_COLUMNS,
  FundingRequestSheetColumn,
} from '../constants/fundingRequest';
import type { SheetCell } from '../types/feedback';
import type {
  FundingRequestKind,
  FundingRequestSubmission,
  PendingFundingRequestRecord,
} from '../types/fundingRequest';
import { UUID_V4_PATTERN, isRecord, toSheetTimestamp } from './feedback';

const isFundingRequestKind = (value: unknown): value is FundingRequestKind =>
  typeof value === 'string' && (FUNDING_REQUEST_KINDS as readonly string[]).includes(value);

const parseBoundedText = (value: unknown, maxLength: number): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return null;
  return trimmed;
};

/**
 * Validates a funding-request body; returns a typed submission, or `null` so the handler owns
 * the 400. Only the fields named here survive, so an extra property cannot reach the sheet.
 */
export const parseFundingRequestSubmission = (body: unknown): FundingRequestSubmission | null => {
  if (!isRecord(body)) return null;

  const { submissionId, kind } = body;
  if (typeof submissionId !== 'string' || !UUID_V4_PATTERN.test(submissionId)) return null;
  if (!isFundingRequestKind(kind)) return null;

  const requestedName = parseBoundedText(body.requestedName, FUNDING_REQUEST_NAME_MAX_LENGTH);
  if (!requestedName) return null;

  // A token request is only interpretable with the chain it was asked for; a chain request has
  // no context.
  let contextChain: string | null = null;
  if (kind === 'token') {
    contextChain = parseBoundedText(body.contextChain, FUNDING_REQUEST_CONTEXT_CHAIN_MAX_LENGTH);
    if (!contextChain) return null;
  } else if (body.contextChain !== undefined && body.contextChain !== null) {
    return null;
  }

  return { submissionId, kind, requestedName, contextChain };
};

/** Maps a validated request to the sheet's row, in `FUNDING_REQUEST_SHEET_COLUMNS` order. */
export const mapFundingRequestToSheetRow = (
  submission: FundingRequestSubmission,
  submittedAt: string,
): SheetCell[] => {
  const cells: Record<FundingRequestSheetColumn, SheetCell> = {
    request_id: submission.submissionId,
    submitted_at: toSheetTimestamp(submittedAt),
    kind: submission.kind,
    requested_name: submission.requestedName,
    context_chain: submission.contextChain ?? '',
  };

  return FUNDING_REQUEST_SHEET_COLUMNS.map((column) => cells[column]);
};

/**
 * Parses a buffered blob back into a record, re-running the submit route's validator. Returns
 * `null` for anything unparseable so the replay quarantines it instead of retrying forever.
 */
export const parsePendingFundingRequestRecord = (
  body: string,
): PendingFundingRequestRecord | null => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return null;
  }

  if (!isRecord(parsed)) return null;
  if (typeof parsed.submittedAt !== 'string' || Number.isNaN(Date.parse(parsed.submittedAt))) {
    return null;
  }

  const submission = parseFundingRequestSubmission(parsed.submission);
  if (!submission) return null;

  return { submittedAt: parsed.submittedAt, submission };
};
