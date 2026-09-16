# Contribute app – CLAUDE.md

Guidance for working on the **Contribute** app in this repo.

## Purpose

Contribute to Olas: staking, contributions, and profile. Integrates with a **backend API**, **Discord** verification, **PFP** service, and **AFMDB**. Users connect a wallet, stake, and manage contribution-related data.

## Port

**3003**

## Stack

- **Wallet**: Yes. RainbowKit (over Wagmi). See `pages/_app.tsx` (RainbowKitProvider), `components/Login/config.ts` (connectorsForWallets + custom Binance wallet), `components/Login/`, `components/Staking/`, `components/Profile/`.
- **State**: Redux (`store/`) + Apollo Client for GraphQL where used.
- **Key libs**: `util-functions`, `util-constants`, `ui-theme`, `ui-components`, `feature-service-status-info`, `common-middleware`, `util-ssr`.

## Env / backends

- **Backend**: `NEXT_PUBLIC_BACKEND_URL`
- **PFP**: `NEXT_PUBLIC_PFP_URL`
- **Discord**: `NEXT_PUBLIC_DISCORD_VERIFICATION_ADDRESS`
- **AFMDB**: `NEXT_PUBLIC_AFMDB_URL`
- **Agent DB** (server-side): `AGENT_DB_WALLET_PRIVATE_KEY`, `AGENT_TYPE_ID`, `ATTRIBUTE_ID_MAPPING`
- RPCs and Wallet Project ID for RainbowKit / WalletConnect.

## Structure

- `pages/` – Next.js routes.
- `components/` – Staking stepper, Profile, Staking details, Login.
- `apolloClient` – GraphQL client if used.
- `store/`, `context/`, hooks in `components/Profile/Staking/hooks.ts`.

## Commands

- Serve: `yarn nx run contribute:serve`
- Build: `yarn nx run contribute:build`
- Test: `yarn nx test contribute`
- Lint: `yarn nx lint contribute`

## Rendering

- `/` and `/leaderboard` render the same tables and share one snapshot,
  `common-util/api/leaderboardSnapshot.ts` (hourly ISR via `createSnapshotGetStaticProps`). Do
  not move either back to `getServerSideProps`: the AFMDB leaderboard read is seven pages and
  ~6k rows, so per-request rendering put the homepage at a ~4s floor and made its uptime track
  AFMDB's. `yarn check:served-text contribute` guards `/leaderboard`, and the shared snapshot
  means `/` cannot regress on its own.
- `/profile/[id]` is ISR (hourly) with `fallback: 'blocking'`, and 404s wallets that are not on
  the leaderboard so any address is not an indexable URL. It needs one wallet's points, but the
  read behind it is the whole leaderboard — see below.
- All three pre-render paths read through `readLeaderboardForPrerender`
  (`common-util/api/leaderboardCache.ts`), which collapses reads that land close together so a
  crawler walking profile URLs does not start a full ~6k-row fetch per address.
  `/api/leaderboard`, which the browser polls for live rows, is deliberately left uncached.

## Notes

- Backend and external services are required for full functionality; ensure env vars are set for local runs.
- Staking and profile logic may depend on both chain state and backend data.
