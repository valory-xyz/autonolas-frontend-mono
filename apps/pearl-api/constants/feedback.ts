/**
 * Onboarding-survey feedback (OPE-1899).
 *
 * Pearl posts one anonymous submission per user at the end of its post-setup
 * questionnaire; it is appended as a single row to a Google Sheet.
 */

/** Friction areas offered by the step-1 multi-select, in the order the design lists them. */
export const VALID_FRICTION_AREAS = [
  'backup_wallet',
  'choosing_agent',
  'activity_rewards',
  'funding_agent',
  'agent_activity',
  'other',
  'everything_smooth',
] as const;

/**
 * The design separates this card from the friction options with a rule: picking it is a
 * fast exit and cannot be combined with an actual friction area.
 */
export const EVERYTHING_SMOOTH = 'everything_smooth';

/** Three-grade rating: 1 = 😕 Bad, 2 = 😐 OK, 3 = 🙂 Good. */
export const VALID_RATINGS = [1, 2, 3] as const;

/** Free-text answers are capped well below the Sheets 50,000-character cell limit. */
export const FEEDBACK_COMMENT_MAX_LENGTH = 2000;

/** Cap for every short auto-captured string (os fields, agent type, Pearl version). */
export const FEEDBACK_SHORT_FIELD_MAX_LENGTH = 64;

/** Written to the sheet when Pearl cannot determine a first-open timestamp. */
export const TIME_TO_FIRST_SUCCESS_UNAVAILABLE = 'unavailable';

export const GOOGLE_SHEETS_CONFIG = {
  CLIENT_EMAIL: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
  PRIVATE_KEY: process.env.GOOGLE_SHEETS_PRIVATE_KEY,
  SHEET_ID: process.env.PEARL_FEEDBACK_SHEET_ID,
};

export const GOOGLE_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const GOOGLE_SHEETS_API_BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';
export const GOOGLE_SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

/**
 * Target tab, addressed by name rather than by `gid` — the Sheets API range needs a title.
 * This is the "Responses" tab of the spreadsheet in PEARL_FEEDBACK_SHEET_ID.
 */
export const FEEDBACK_SHEET_TAB = 'Responses';

/**
 * Fixed column order. The sheet carries a matching header row and a "do not reorder these
 * columns" note; this constant is the code-side half of that contract, so both the submit
 * handler and the cron replay write the same shape.
 */
export const FEEDBACK_SHEET_COLUMNS = [
  'Submitted at',
  'Submission ID',
  'Friction areas',
  'Everything was smooth',
  'Rating',
  'Comment',
  'OS type',
  'OS platform',
  'OS arch',
  'OS release',
  'Agent type',
  'Pearl version',
  'Time to first success (s)',
  'Time to complete survey (s)',
] as const;

/** `Responses!A:N` — N is the 14th column, matching FEEDBACK_SHEET_COLUMNS. */
export const FEEDBACK_SHEET_RANGE = `${FEEDBACK_SHEET_TAB}!A:N`;

/** Prefix for submissions buffered in Blob after a Sheets failure, drained by the cron route. */
export const FEEDBACK_PENDING_PREFIX = 'feedback/pending';

/** Where the replay sets aside a pending blob it can never turn into a row, rather than deleting it. */
export const FEEDBACK_UNREADABLE_PREFIX = 'feedback/unreadable';

/**
 * One cron run drains at most this many buffered submissions, so a large backlog cannot time out.
 *
 * Sized against the `maxDuration: 60` that `vercel.json` gives the replay route. The loop is
 * sequential — one Blob read plus one Sheets append per submission — so at a conservative ~400ms
 * per entry a full batch is ~20s, leaving room for the token exchange on the cold start a daily
 * cron always is. A backlog larger than this simply drains over consecutive runs.
 */
export const FEEDBACK_REPLAY_BATCH_SIZE = 50;
