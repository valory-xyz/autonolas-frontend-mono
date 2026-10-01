import {
  FUNDING_REQUEST_CONTEXT_CHAIN_MAX_LENGTH,
  FUNDING_REQUEST_CONTEXT_CHAIN_PATTERN,
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
import { UUID_V4_PATTERN, isRecord, parsePendingRecord, toSheetTimestamp } from './feedback';

const isFundingRequestKind = (value: unknown): value is FundingRequestKind =>
  typeof value === 'string' && (FUNDING_REQUEST_KINDS as readonly string[]).includes(value);

const parseBoundedText = (value: unknown, maxLength: number): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return null;
  return trimmed;
};

/** Returns only the fields named here, so an extra property cannot reach the sheet. */
export const parseFundingRequestSubmission = (body: unknown): FundingRequestSubmission | null => {
  if (!isRecord(body)) return null;

  const { submissionId, kind } = body;
  if (typeof submissionId !== 'string' || !UUID_V4_PATTERN.test(submissionId)) return null;
  if (!isFundingRequestKind(kind)) return null;

  const requestedName = parseBoundedText(body.requestedName, FUNDING_REQUEST_NAME_MAX_LENGTH);
  if (!requestedName) return null;

  // A token request is only interpretable with the chain it was asked for; a chain request has
  // no context.
  if (kind === 'token') {
    const contextChain = parseBoundedText(
      body.contextChain,
      FUNDING_REQUEST_CONTEXT_CHAIN_MAX_LENGTH,
    );
    if (!contextChain || !FUNDING_REQUEST_CONTEXT_CHAIN_PATTERN.test(contextChain)) return null;
    return { submissionId, kind, requestedName, contextChain };
  }
  if (body.contextChain !== undefined && body.contextChain !== null) return null;

  return { submissionId, kind, requestedName, contextChain: null };
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

/** `null` means the replay quarantines the blob. */
export const parsePendingFundingRequestRecord = (
  body: string,
): PendingFundingRequestRecord | null => parsePendingRecord(body, parseFundingRequestSubmission);
