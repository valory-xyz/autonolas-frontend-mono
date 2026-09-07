import { createSign } from 'node:crypto';

import {
  GOOGLE_OAUTH_TOKEN_URL,
  GOOGLE_SHEETS_API_BASE_URL,
  GOOGLE_SHEETS_CONFIG,
  GOOGLE_SHEETS_SCOPE,
} from '../constants';

const TOKEN_LIFETIME_SECONDS = 3600;
/** Renew a little early so a token cannot expire between the check and the append. */
const TOKEN_EXPIRY_SKEW_SECONDS = 60;

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
    JSON.stringify({
      iss: clientEmail,
      sub: clientEmail,
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
  });

  if (!response.ok) {
    // Google's body can echo the service-account identity, so it is logged and never forwarded.
    console.error(`Google token exchange failed: ${response.status} ${response.statusText}`);
    throw new Error('Failed to obtain a Google access token');
  }

  const body: unknown = await response.json();
  const accessToken =
    typeof body === 'object' && body !== null && 'access_token' in body
      ? (body as { access_token: unknown }).access_token
      : undefined;

  if (typeof accessToken !== 'string' || !accessToken) {
    throw new Error('Google token response did not contain an access token');
  }

  cachedToken = {
    accessToken,
    expiresAtMs: Date.now() + (TOKEN_LIFETIME_SECONDS - TOKEN_EXPIRY_SKEW_SECONDS) * 1000,
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
export const appendSheetRow = async (range: string, row: readonly string[]): Promise<void> => {
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
  });

  if (!response.ok) {
    // A stale cached token is the most likely cause of a 401; drop it so the next call re-signs.
    if (response.status === 401) cachedToken = null;
    console.error(`Google Sheets append failed: ${response.status} ${response.statusText}`);
    throw new Error('Failed to append the row to the Google Sheet');
  }
};
