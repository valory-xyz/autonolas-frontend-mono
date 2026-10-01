# Pearl API app – CLAUDE.md

Guidance for working on the **Pearl API** app in this repo.

## Purpose

**API and auth backend** for Olas: provides Next.js API routes and Web3Auth-based flows. Used for support (Zendesk), achievements (image generation), agent eligibility (geo), Pearl onboarding-survey feedback, Pearl funding-flow chain/token requests, and Web3Auth login/session management. Not a typical frontend; it’s an API app with a few front-end pages for Web3Auth.

## Port

**3010**

## Stack

- **Wallet / Auth**: **Web3Auth** (modal, login, swap-owner-session). Not WalletConnect for general dapp use; used for embedded auth/session.
- **API routes**: Next.js `pages/api/` – Zendesk (create-ticket, upload-file), achievement (get-image, generate-image, get-data), geo (agent-eligibility), feedback (onboarding-survey, funding-request, replay-pending).
- **Key libs**: No shared Nx libs in project config; uses Next.js, Web3Auth, styled-components, and app-local `context/`, `hooks/`, `utils/`, `constants/`, `types/`.

## Env / backends

- **Web3Auth**: `NEXT_PUBLIC_WEB3AUTH_CLIENT_ID`
- **CORS**: no env var. `utils/cors.ts` hardcodes an allowlist of `http://localhost:*` and
  `http://127.0.0.1:*` origins, which is what lets Pearl's Electron renderer call these routes.
- **Zendesk**: `ZENDESK_SUBDOMAIN`, `ZENDESK_API_TOKEN`, `ZENDESK_API_EMAIL` (see root `.env.example`)
- **Achievements Blob store** (public): `BLOB_READ_WRITE_TOKEN`, resolved by the SDK from the
  environment.
- **Achievement card data**: `NEXT_PUBLIC_OLAS_POLYMARKET_AGENTS_SQUID_URL` (Polystrat bets, the
  predict-polymarket SQD squid), `NEXT_PUBLIC_OLAS_PREDICT_AGENTS_SUBGRAPH_URL` (predict-omen
  subgraph for Omenstrat bets). Both agent URLs are required when used and have no default.
  Clients are built on first use, so a missing variable fails only the agent that needs it.
  Achievement cards use agent logos and do not fetch market thumbnails.
- **Onboarding survey**: `GOOGLE_SHEETS_CLIENT_EMAIL`, `GOOGLE_SHEETS_PRIVATE_KEY`,
  `PEARL_FEEDBACK_SHEET_ID`, `CRON_SECRET`, `FEEDBACK_BLOB_READ_WRITE_TOKEN`. All server-only —
  none may be given a `NEXT_PUBLIC_` prefix, which would inline it into the client bundle.

## Structure

- `pages/api/` – Zendesk, achievement, geo and feedback API handlers.
- `pages/web3auth/` – Web3Auth login and swap-owner-session pages.
- `context/`, `hooks/`, `components/`, `utils/`, `constants/`, `types/` – App-local code.

## Commands

- Serve: `yarn nx run pearl-api:serve`
- Build: `yarn nx run pearl-api:build`
- Test: `yarn nx test pearl-api`
- Lint: `yarn nx lint pearl-api`

## Achievements (winning cards)

Pearl posts `generate-image?agent&type&id` for the winning card sharing image. Predict reads
the generated OG image through the Blob lookup and fetches its card figures directly from
the venue-specific data sources; it does not consume `get-data`.

- Agents: `polystrat` and `omenstrat`, type `payout`. `id` is the bet id the agent put in the
  achievement record; `_` is allowed for squid ids (`0x…_1460`), and legacy Polymarket ids are
  converted with `toSquidBetId`.
- `GET /api/achievement/get-data` returns the card figures plus `marketImageUrl: null` for
  compatibility. `404` when the bet is not a settled win; only a `200` carries a long `s-maxage`.
- **"Won" is this bet's share, not the market total.** `utils/betPayout.ts` ports the trader
  agent's FIFO sell folding and per-agent payout rule, so the card agrees with Pearl's pop-up when
  an agent holds several bets in one market. Its spec shares a fixture with the trader's
  `test_multi_bet_per_buy_payout_parity_fixture`; change both together.
- Responses and cards carry no bettor or Safe address.

## Onboarding survey (OPE-1899)

Pearl shows a one-time post-setup questionnaire and posts the result here.

- `POST /api/feedback/onboarding-survey` – public, called by Pearl. Takes one **anonymous**
  submission and appends one row to the `Responses` tab of the sheet in `PEARL_FEEDBACK_SHEET_ID`.
  Delivery is two-tier: the Sheets append is primary, and any failure buffers the validated
  submission to Blob under `feedback/pending/<submissionId>.json` and still answers `200`. `502`
  is returned only when both tiers fail — the one case where Pearl keeps its sidebar nudge.
- `GET /api/feedback/replay-pending` – cron-only, requires `Authorization: Bearer $CRON_SECRET`.
  Declared in `vercel.json` `crons` on `0 3 * * *`. Daily is deliberate: Vercel's Hobby plan
  rejects a more frequent expression at deploy time. On Pro, `0 * * * *` is a one-line change.
  Deletes each pending blob only after its append succeeds; a blob it cannot parse is moved to
  `feedback/unreadable/` and never retried.

Rules that are easy to break:

- **The payload is anonymous and must stay that way.** No wallet address, account id, email or
  IP-derived value may be added to the request type, the sheet row or the pending blob. The row
  mapper reads the validated submission rather than `req.body`, which is what enforces this.
- **Do not reorder the sheet columns.** `FEEDBACK_SHEET_COLUMNS` in `constants/feedback.ts` must
  match the `Responses` header row; `mapSubmissionToSheetRow` emits cells in that order, so both
  the submit route and the cron replay write through it. Each friction option maps to its
  `step_*` column in `FRICTION_AREA_COLUMN` (`utils/feedback.ts`); "Other" has no column and is
  recorded through `open_text` only.
- **The append must keep `insertDataOption=INSERT_ROWS`** — without it the Sheets API can
  overwrite cells below the detected table. `valueInputOption=RAW` keeps free text starting with
  `=` from being evaluated as a formula *in Sheets*. The literal survives into a CSV export, and
  Excel or Numbers will evaluate a leading `=`, `+`, `-` or `@` when an analyst opens that file —
  export with care rather than trusting the cell.
- **Both Google calls carry `AbortSignal.timeout`.** Without it a stalled connection runs to the
  route's `maxDuration`, Vercel kills the function, and the Blob fallback never runs.
- **The replay cron answers 500 when anything failed, was left undeleted, or was left pending
  beyond the run's batch**, so a backlog that never drains shows up in Vercel's cron history. Each
  source is listed and drained on its own: a source whose list fails counts as `failed` and the
  others still drain.
- **There is no server-side dedup.** `submissionId` exists so duplicates can be filtered during
  analysis; a client must not auto-retry a 2xx.
- **Pending blobs live in a separate private Blob store.** They hold free text and must not be
  readable by URL. Store access is fixed at creation, so they cannot share the public achievements
  store; every feedback call in `utils/blob.ts` passes `FEEDBACK_BLOB_READ_WRITE_TOKEN` explicitly
  and throws if it is unset, otherwise the SDK would silently fall back to the achievements store's
  credentials. Private access is why `@vercel/blob` is on the 2.x line; 0.x permitted `'public'`
  only.
- **`put` on a deterministic pathname: decide on overwrite explicitly.** Since 2.x `put` throws on
  an existing pathname unless `allowOverwrite: true`. `setLookupEntry` (achievements) opts in
  because re-generation must replace the entry. `putPendingFeedback` deliberately does **not**:
  every attempt carries a fresh `submissionId`, so a repeat path is a bug that should surface
  rather than silently replace an earlier buffered submission.
- The replay re-validates each blob it reads rather than trusting its shape. One it can never map
  to a row is copied to `feedback/unreadable/` and removed from the pending prefix — the batch is
  listed with no cursor, so an entry that always fails would otherwise hold a slot on every run.
  Anything under that prefix means the writer has a bug and is worth reading by hand.
- **Sheet cells keep their types.** The row mapper emits numbers and booleans as such (not
  strings) so that under `valueInputOption=RAW` the rating, timing and `step_*` columns are
  numeric/boolean cells that AVERAGE and filters work on.

**One-time Google setup** (not code): enable the Sheets API on the Google Cloud project; create a
service account with no project roles; create a JSON key; share the spreadsheet with the
service-account email as **Editor**; confirm the destination tab is named `Responses`; set
`GOOGLE_SHEETS_CLIENT_EMAIL`, `GOOGLE_SHEETS_PRIVATE_KEY`, `PEARL_FEEDBACK_SHEET_ID` and
`CRON_SECRET` in the Vercel **production** environment.

**One-time Blob setup** (not code): in the pearl-api project's Storage tab create a second Blob
store with access set to **Private**, and connect it to the project with the env-var prefix
`FEEDBACK_` so it lands as `FEEDBACK_BLOB_READ_WRITE_TOKEN` without colliding with the
achievements store's `BLOB_READ_WRITE_TOKEN`.

**Also configure in the Vercel dashboard** (not in this repo): a WAF rate-limit rule on
`/api/feedback/onboarding-survey`, keyed by IP, fixed window, `429` action. The endpoint is
unauthenticated by product requirement, so abuse control lives there rather than in code.

## Funding requests (OPE-1903)

Pearl's funding flow offers "Other chain" / "Other token". Submitting one records the request as
an internal demand signal.

- `POST /api/feedback/funding-request` – public, called by Pearl's renderer directly (the
  middleware is not involved). Body `{ submissionId, kind: "chain" | "token", requestedName,
  contextChain }`; `contextChain` is `null` for a chain request and the already-selected chain's
  middleware name (e.g. `base`) for a token request. Appends one row to the `FundingRequests` tab
  of the **same** spreadsheet as the survey (`PEARL_FEEDBACK_SHEET_ID`), columns
  `FUNDING_REQUEST_SHEET_COLUMNS` in `constants/fundingRequest.ts`. Answers `{ ok: true }`, `400`,
  `405`, or `502` when both tiers fail.
- Same two-tier delivery as the survey: a failed append buffers the validated request to the
  private feedback Blob store under `feedback/pending-funding-requests/<submissionId>.json`, and
  `GET /api/feedback/replay-pending` drains that prefix too, splitting one batch evenly with the
  surveys so a stuck survey backlog cannot block it (its counts are reported under
  `fundingRequests`). Unreadable records go to `feedback/unreadable/funding-requests/`, apart
  from the surveys' so the same id cannot overwrite one.

Rules that are easy to break:

- **Anonymity by construction.** The payload is the requested name plus, for a token, the chain
  it was asked on, which must be a lowercase slug starting with a letter so an address cannot
  pass. No wallet address, balance, account id, IP or Pearl version may be added. The row mapper
  and the Blob writer read the typed `FundingRequestSubmission`, never `req.body`.
- **The acknowledgement is neutral.** The response body is only `{ ok: true }`; the copy Pearl
  shows promises nothing about the request being acted on.
- **Free text is untrusted.** `valueInputOption=RAW` keeps a leading `=`/`+` from being evaluated
  in Sheets, but a CSV export opened in Excel or Numbers will evaluate it — export with care.
- All the survey rules above about `INSERT_ROWS`, `AbortSignal.timeout`, the private Blob token,
  no overwrite on `put` and no server-side dedup apply unchanged: the route reuses the same
  helpers.

**One-time setup** (not code): add a `FundingRequests` tab to the existing feedback spreadsheet
with the header row `request_id, submitted_at, kind, requested_name, context_chain`. The service
account already has access. In the Vercel dashboard, add a WAF rate-limit rule on
`/api/feedback/funding-request`, keyed by IP, mirroring the survey route's.

## Notes

- This app is API- and auth-focused; it does not use the same WalletConnect/Web3Modal pattern as Bond, Marketplace, etc.
- Zendesk and Web3Auth env vars must be set for those features to work.
- CORS is **not** configurable by env var — `utils/cors.ts` hardcodes the localhost origin check.

### Achievement eligibility

- Both agents require per-buy payout / original cost strictly above 1.5.
- Omenstrat requires a winning outcome, positive redeemed participant payout and
  FIFO shares remaining above 10^16 base units. Redemption is the finalization signal;
  provisional answers and sale proceeds alone cannot qualify. Fully sold buys are excluded.
- Polystrat follows trader's existing hybrid rule: a resolved, non-invalid market with
  a profitable fully exited buy can qualify regardless of outcome. Otherwise require a
  redeemed winning outcome. Remaining shares <=10,000 base units contribute no redemption.
- `marketImageUrl` remains null for compatibility; no thumbnail subgraph is queried.
