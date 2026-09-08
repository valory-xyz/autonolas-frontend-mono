# Operate app – CLAUDE.md

Guidance for working on the **Operate** app in this repo.

## Purpose

**Operate** staking contracts: manage and interact with existing staking contracts (e.g. deposits, rewards, nominations). Users connect a wallet to operate on supported chains.

## Port

**3007**

## Stack

- **Wallet**: RainbowKit (over Wagmi). See `context/Web3ModalProvider.tsx` (filename kept pending a cross-app rename), `pages/_app.tsx`.
- **State**: Redux (`store/`).
- **Key libs**: `util-constants`, `util-functions`, `ui-theme`, `common-contract-functions`, `util-contracts`, `ui-components`, `common-middleware`, `util-ssr`.

## Env / backends

- Staking contract subgraphs and RPCs for supported chains.
- Wallet Project ID for RainbowKit (WalletConnect Cloud projectId — required by `getDefaultConfig`).

## Structure

- `pages/` – Next.js routes.
- `components/` – Operate-specific UI (staking contract operations).
- `store/`, `context/`.

## Commands

- Serve: `yarn nx run operate:serve`
- Build: `yarn nx run operate:build`
- Test: `yarn nx test operate`
- Lint: `yarn nx lint operate`

## Contracts page rendering (`/contracts`)

`getStaticProps` pre-renders the staking-contract table via `fetchOperateContracts()` and
revalidates every 5 minutes (ISR). The rows ship as HTML, so crawlers and AI assistants read the
real contract list instead of an empty shell — the page previously served ~870 characters of
readable text with `No data` where the table belongs, which contradicted what `llms.txt` promises.

- **ISR, not `getServerSideProps`.** PR #350 moved this page to client-only because per-request
  SSR hung serverless workers on slow RPCs. ISR pays that cost once per window instead, and a
  failed revalidation leaves the last good snapshot in place.
- `ContractsPage` takes `initialContracts` and shows it until `useStakingContractsList()` resolves.
  On the first client render that hook returns `[]`, so the markup matches the server exactly.
- The server and client lists must stay identical or hydration diverges: both merge
  `EXTRA_STAKING_CONTRACTS` and both filter platforms through `sanitizeAvailableOn`
  (`common-util/constants/contracts.ts` owns `AVAILABLE_ON_VALUES`, the single source of truth).
- **Never let this page render `No data`.** The table's `locale.emptyText` describes what the
  table lists instead.
- **Relative times do not survive caching.** The visible countdown (`timeRemaining`) is frozen at
  render time and served for minutes; `epochEndsAt` publishes the absolute epoch end alongside it
  in hidden text, derived as `tsCheckpoint + livenessPeriod` on both the server and client paths.
- **Failure semantics matter.** `createSnapshotGetStaticProps` (in `libs/util-ssr`) rethrows when
  a *revalidation* fails, so Next keeps serving the last good page. Returning empty props instead
  looks safe but is a successful render to Next: it caches the empty result and overwrites the
  working table. Failures during the *build* are swallowed, because a throw there fails the whole
  build and there is no previous page to fall back to.
- **Published figures carry scope and an as-of time**, per the Phase 1 standard. Pre-rendered HTML
  is read long after it was generated, so a hidden (`.sr-only`) line states what the table counts
  and when the snapshot was taken. Hidden, not visible — the visible design is unchanged.
- **Guarded by tests, not just by review.** `*.prerender.spec.tsx` asserts the table renders rows
  from `initialContracts` and never renders a bare `No data`; both run in CI. `yarn
  check:served-text <app>` makes the same assertions against real built HTML after `nx build`.
- Transports use `http(rpc, { batch: true })`. Without it the per-contract reads are slow enough
  to blow the ISR budget.
- `hasSubgraphSupport` reports false for chains whose `NEXT_PUBLIC_*_STAKING_SUBGRAPH_URL` is
  unset. Previously an unset var still produced a client and failed later with "Only absolute URLs
  are supported", one wasted request per contract before falling back to RPC.

## Notes

- Contract interactions and rewards often use `common-contract-functions` (e.g. useRewards, useNominees). Ensure correct chain when reading or writing.
- Wallet session persists across refresh: wagmi config uses `storage: createStorage({ storage: cookieStorage })` and `_app.tsx` feeds `cookieToInitialState(wagmiConfig)` into the provider's `initialState`. Don't gate `WagmiProvider` behind an `isMounted` flag — pages calling `useConfig` at top-render fail SSR/static export when the provider isn't there.
