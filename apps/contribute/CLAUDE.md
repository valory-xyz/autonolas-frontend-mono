# Contribute app – CLAUDE.md

Guidance for working on the **Contribute** app in this repo.

## Purpose

Contribute to Olas: staking, contributions, and profile. Integrates with a **backend API**, **Discord** verification, **PFP** service, and **AFMDB**. Users connect a wallet, stake, and manage contribution-related data.

## Port

**3003**

## Stack

- **Wallet**: Yes. Web3Modal (Wagmi). See `pages/_app.tsx` (createWeb3Modal), `components/Login/`, `components/Staking/`, `components/Profile/`.
- **State**: Redux (`store/`) + Apollo Client for GraphQL where used.
- **Key libs**: `util-functions`, `util-constants`, `ui-theme`, `ui-components`, `feature-service-status-info`, `common-middleware`, `util-ssr`.

## Env / backends

- **Backend**: `NEXT_PUBLIC_BACKEND_URL`
- **PFP**: `NEXT_PUBLIC_PFP_URL`
- **Discord**: `NEXT_PUBLIC_DISCORD_VERIFICATION_ADDRESS`
- **AFMDB**: `NEXT_PUBLIC_AFMDB_URL`
- **Agent DB** (server-side): `AGENT_DB_WALLET_PRIVATE_KEY`, `AGENT_TYPE_ID`, `ATTRIBUTE_ID_MAPPING`
- RPCs and Wallet Project ID for Web3Modal.

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

## Notes

- Backend and external services are required for full functionality; ensure env vars are set for local runs.
- Staking and profile logic may depend on both chain state and backend data.
