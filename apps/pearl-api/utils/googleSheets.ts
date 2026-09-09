import { createSign } from 'node:crypto';

import {
  GOOGLE_OAUTH_TOKEN_URL,
  GOOGLE_SHEETS_API_BASE_URL,
  GOOGLE_SHEETS_CONFIG,
  GOOGLE_SHEETS_SCOPE,
} from '../constants';
import type { SheetCell } from '../types';

/** Assertion lifetime; Google rejects anything over one hour. */
const TOKEN_LIFETIME_SECONDS = 3600;
/** Renew a little early so a token cannot expire between the check and the append. */
const TOKEN_EXPIRY_SKEW_SECONDS = 60;
/**
 * Per-call timeouts, well under the submit route's 30s `maxDuration`. Without them a stalled
 * connection runs until Vercel kills the function, and the Blob fallback never gets to run.
 */
const TOKEN_EXCHANGE_TIMEOUT_MS = 10_000;
const APPEND_TIMEOUT_MS = 15_000;

type CachedToken = {
  accessToken: string;
  expiresAtMs: number;
};

/**
 * Module-scope cache. This survives only inside a warm serverless instance — at this traffic
 * level most invocations are cold starts that pay for both the token exchange and the append.
 * It is an optimisation for bursts, not a guarantee of a single outbound call.
 */
let cachedToken: CachedToken | null = null;

const base64Url = (input: Buffer | string): string =>
  Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/**
 * Vercel stores multi-line secrets with escaped newlines, so the PEM arrives as a single line
 * with literal `\n` sequences. `createSign` needs the real newlines back.
 */
const normalizePrivateKey = (key: string): string => key.replace(/\\n/g, '\n');

const buildSignedAssertion = (clientEmail: string, privateKey: string): string => {
  const issuedAt = Math.floor(Date.now() / 1000);

  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64Url(
    // No `sub`: Google documents it only for domain-wide delegation (impersonating a user).
    JSON.stringify({
      iss: clientEmail,
      scope: GOOGLE_SHEETS_SCOPE,
      aud: GOOGLE_OAUTH_TOKEN_URL,
      iat: issuedAt,
      exp: issuedAt + TOKEN_LIFETIME_SECONDS,
    }),
  );

  const signingInput = `${header}.${claims}`;
  const signature = createSign('RSA-SHA256')
    .update(signingInput)
    .sign(normalizePrivateKey(privateKey));

  return `${signingInput}.${base64Url(signature)}`;
};

const getAccessToken = async (): Promise<string> => {
  const { CLIENT_EMAIL, PRIVATE_KEY } = GOOGLE_SHEETS_CONFIG;

  if (!CLIENT_EMAIL || !PRIVATE_KEY) {
    throw new Error('Google Sheets service-account credentials are not configured');
  }

  if (cachedToken && cachedToken.expiresAtMs > Date.now()) {
    return cachedToken.accessToken;
  }

  const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: buildSignedAssertion(CLIENT_EMAIL, PRIVATE_KEY),
    }),
    signal: AbortSignal.timeout(TOKEN_EXCHANGE_TIMEOUT_MS),
  });

  if (!response.ok) {
    // Google's body can echo the service-account identity, so it is logged and never forwarded.
    console.error(`Google token exchange failed: ${response.status} ${response.statusText}`);
    throw new Error('Failed to obtain a Google access token');
  }

  const body: unknown = await response.json();
  const tokenResponse =
    typeof body === 'object' && body !== null
      ? (body as { access_token?: unknown; expires_in?: unknown })
      : {};

  const accessToken = tokenResponse.access_token;
  if (typeof accessToken !== 'string' || !accessToken) {
    throw new Error('Google token response did not contain an access token');
  }

  // The access token's real lifetime comes from the response, not from the assertion's `exp`.
  const expiresInSeconds =
    typeof tokenResponse.expires_in === 'number'
      ? tokenResponse.expires_in
      : TOKEN_LIFETIME_SECONDS;

  cachedToken = {
    accessToken,
    expiresAtMs: Date.now() + (expiresInSeconds - TOKEN_EXPIRY_SKEW_SECONDS) * 1000,
  };

  return accessToken;
};

/**
 * Appends one row to the configured spreadsheet.
 *
 * `insertDataOption=INSERT_ROWS` is required: without it the API can overwrite cells below the
 * detected table rather than inserting a row. `valueInputOption=RAW` keeps a free-text answer
 * beginning with `=` or `+` stored as text instead of evaluated as a formula.
 */
export const appendSheetRow = async (range: string, row: readonly SheetCell[]): Promise<void> => {
  const { SHEET_ID } = GOOGLE_SHEETS_CONFIG;

  if (!SHEET_ID) {
    throw new Error('PEARL_FEEDBACK_SHEET_ID is not configured');
  }

  const accessToken = await getAccessToken();

  const url = new URL(
    `${GOOGLE_SHEETS_API_BASE_URL}/${SHEET_ID}/values/${encodeURIComponent(range)}:append`,
  );
  url.searchParams.set('valueInputOption', 'RAW');
  url.searchParams.set('insertDataOption', 'INSERT_ROWS');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: [row] }),
    signal: AbortSignal.timeout(APPEND_TIMEOUT_MS),
  });

  if (!response.ok) {
    // A stale cached token is the most likely cause of a 401; drop it so the next call re-signs.
    if (response.status === 401) cachedToken = null;
    // Unlike the token exchange, the append body names the actual problem (PERMISSION_DENIED for
    // a revoked share, NOT_FOUND for a wrong sheet id, INVALID_ARGUMENT for a renamed tab) and
    // is the only signal an operator gets, since the user is shown a success either way.
    const detail = await describeSheetsError(response);
    console.error(
      `Google Sheets append failed: ${response.status} ${response.statusText}${detail}`,
    );
    throw new Error('Failed to append the row to the Google Sheet');
  }
};

const describeSheetsError = async (response: Response): Promise<string> => {
  try {
    const body: unknown = await response.json();
    const error =
      typeof body === 'object' && body !== null && 'error' in body
        ? (body as { error?: { status?: unknown; message?: unknown } }).error
        : undefined;
    if (!error) return '';
    return ` — ${String(error.status ?? '')}: ${String(error.message ?? '')}`;
  } catch {
    return '';
  }
};
