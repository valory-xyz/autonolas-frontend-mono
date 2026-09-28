/**
 * "Other chain" / "Other token" requests from Pearl's funding flow (OPE-1903).
 *
 * Pearl posts one anonymous request whenever a user asks for a chain or token the funding flow
 * does not support; it is appended as a single row to a tab of the existing feedback sheet, as an
 * internal demand signal.
 */

export const FUNDING_REQUEST_KINDS = ['chain', 'token'] as const;

/** The requested name is free text: a chain or token name, never an essay. */
export const FUNDING_REQUEST_NAME_MAX_LENGTH = 64;

/**
 * A token request carries the middleware name of the chain it was requested on (e.g. `base`),
 * which is a product-defined identifier, not user data. Capped like any short field.
 */
export const FUNDING_REQUEST_CONTEXT_CHAIN_MAX_LENGTH = 64;

/** New tab in the spreadsheet addressed by `GOOGLE_SHEETS_CONFIG.SHEET_ID`. */
export const FUNDING_REQUEST_SHEET_TAB = 'FundingRequests';

/**
 * Column order, matching the tab's header row exactly. `mapFundingRequestToSheetRow` emits cells
 * in this order, so this is the only place it is defined.
 */
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
