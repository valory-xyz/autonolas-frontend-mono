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
  not move either back to `getServerSideProps`: that ran a function and re-rendered every row
  on each visit, behind a `no-store` response.
- `/profile/[id]` is ISR with `fallback: 'blocking'`. It 404s wallets that are not on the
  leaderboard, so any address is not an indexable URL — but on a short window, because
  `toLeaderboardUsers` filters zero-point wallets and a new wallet must stop 404ing as soon as
  its first points land.
- All three read through `fetchLeaderboardData`, which holds one result for a minute across
  every page and API route on a warm instance. AFMDB's `values` endpoint has no ORDER BY, so it
  reads the attribute in one query rather than paging — see the note there before changing it.

## Notes

- Backend and external services are required for full functionality; ensure env vars are set for local runs.
- Staking and profile logic may depend on both chain state and backend data.
