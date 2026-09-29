# Pearl API app – CLAUDE.md

Guidance for working on the **Pearl API** app in this repo.

## Purpose

**API and auth backend** for Olas: provides Next.js API routes and Web3Auth-based flows. Used for support (Zendesk), achievements (image generation), agent eligibility (geo), Pearl onboarding-survey feedback, and Web3Auth login/session management. Not a typical frontend; it’s an API app with a few front-end pages for Web3Auth.

## Port

**3010**

## Stack

- **Wallet / Auth**: **Web3Auth** (modal, login, swap-owner-session). Not WalletConnect for general dapp use; used for embedded auth/session.
- **API routes**: Next.js `pages/api/` – Zendesk (create-ticket, upload-file), achievement (get-image, generate-image, get-data), geo (agent-eligibility), feedback (onboarding-survey, replay-pending).
- **Key libs**: No shared Nx libs in project config; uses Next.js, Web3Auth, styled-components, and app-local `context/`, `hooks/`, `utils/`, `constants/`, `types/`.

## Env / backends

- **Web3Auth**: `NEXT_PUBLIC_WEB3AUTH_CLIENT_ID`
- **CORS**: no env var. `utils/cors.ts` hardcodes an allowlist of `http://localhost:*` and
  `http://127.0.0.1:*` origins, which is what lets Pearl's Electron renderer call these routes.
- **Zendesk**: `ZENDESK_SUBDOMAIN`, `ZENDESK_API_TOKEN`, `ZENDESK_API_EMAIL` (see root `.env.example`)
- **Achievements Blob store** (public): `BLOB_READ_WRITE_TOKEN`, resolved by the SDK from the
  environment.
- **Achievement card data**: `NEXT_PUBLIC_OLAS_POLYMARKET_AGENTS_SQUID_URL` (Polystrat bets, the
  predict-polymarket SQD squid), `PREDICT_OMEN_URL` (optional override of the public predict-omen
  subgraph for Omenstrat bets) and `THEGRAPH_API_KEY` (server-only; Omen market thumbnails). The
  clients are built on first use, so a missing variable fails only the agent that needs it, and a
  missing `THEGRAPH_API_KEY` renders the Omenstrat card without the market icon.
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

Pearl posts `generate-image?agent&type&id` when it shows a winning-card pop-up; olas-predict reads
`get-image` for `og:image` and `get-data` for the card figures of its public page.

- Agents: `polystrat` and `omenstrat`, type `payout`. `id` is the bet id the agent put in the
  achievement record; `_` is allowed for squid ids (`0x…_1460`), and legacy Polymarket ids are
  converted with `toSquidBetId`.
- `GET /api/achievement/get-data` returns the card figures plus `marketImageUrl` (Omen only, may be
  null). `404` when the bet is not a settled win; only a `200` carries a long `s-maxage`.
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
- **The replay cron answers 500 when anything failed or was left undeleted**, so a backlog that
  never drains shows up in Vercel's cron history.
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

## Notes

- This app is API- and auth-focused; it does not use the same WalletConnect/Web3Modal pattern as Bond, Marketplace, etc.
- Zendesk and Web3Auth env vars must be set for those features to work.
- CORS is **not** configurable by env var — `utils/cors.ts` hardcodes the localhost origin check.
