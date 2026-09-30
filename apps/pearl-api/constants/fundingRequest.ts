export const FUNDING_REQUEST_KINDS = ['chain', 'token'] as const;

/** The requested name is free text: a chain or token name, never an essay. */
export const FUNDING_REQUEST_NAME_MAX_LENGTH = 64;

export const FUNDING_REQUEST_CONTEXT_CHAIN_MAX_LENGTH = 64;

/** A middleware chain name (e.g. `base`); the leading letter also rules out a `0x…` address. */
export const FUNDING_REQUEST_CONTEXT_CHAIN_PATTERN = /^[a-z][a-z0-9_-]*$/;

export const FUNDING_REQUEST_SHEET_TAB = 'FundingRequests';

/** Must match the tab's header row. */
export const FUNDING_REQUEST_SHEET_COLUMNS = [
  'request_id',
  'submitted_at',
  'kind',
  'requested_name',
  'context_chain',
] as const;

export type FundingRequestSheetColumn = (typeof FUNDING_REQUEST_SHEET_COLUMNS)[number];

/** The tab name alone is valid A1 notation; see `FEEDBACK_SHEET_RANGE`. */
export const FUNDING_REQUEST_SHEET_RANGE = FUNDING_REQUEST_SHEET_TAB;

/** Requests buffered in the private feedback Blob store after a Sheets failure. */
export const FUNDING_REQUEST_PENDING_PREFIX = 'feedback/pending-funding-requests';
