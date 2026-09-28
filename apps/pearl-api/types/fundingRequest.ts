import { FUNDING_REQUEST_KINDS } from '../constants/fundingRequest';

export type FundingRequestKind = (typeof FUNDING_REQUEST_KINDS)[number];

/**
 * One "Other chain" / "Other token" request, after validation.
 *
 * Deliberately carries only the requested name and, for a token, the chain it was requested on:
 * no wallet address, balance or account id. The row mapper and the pending-blob writer both work
 * from this type, so it is what bounds what can reach the sheet.
 */
export type FundingRequestSubmission = {
  submissionId: string;
  kind: FundingRequestKind;
  requestedName: string;
  /** `null` for a chain request; the chain already selected for a token request. */
  contextChain: string | null;
};

/** A buffered request in Blob; `submittedAt` is the original arrival time. */
export type PendingFundingRequestRecord = {
  submittedAt: string;
  submission: FundingRequestSubmission;
};

/** Acknowledgement only: the route promises nothing about the request. */
export type FundingRequestResponse = {
  ok: true;
};
