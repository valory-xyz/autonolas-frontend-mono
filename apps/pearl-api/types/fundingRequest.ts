import { FUNDING_REQUEST_KINDS } from '../constants/fundingRequest';

export type FundingRequestKind = (typeof FUNDING_REQUEST_KINDS)[number];

type FundingRequestBase = {
  submissionId: string;
  requestedName: string;
};

/** The only shape the row mapper and pending-blob writer accept, so it bounds what is stored. */
export type FundingRequestSubmission =
  | (FundingRequestBase & { kind: 'chain'; contextChain: null })
  | (FundingRequestBase & { kind: 'token'; contextChain: string });

/** A buffered request in Blob; `submittedAt` is the original arrival time. */
export type PendingFundingRequestRecord = {
  submittedAt: string;
  submission: FundingRequestSubmission;
};

export type FundingRequestResponse = {
  ok: true;
};
