# Build app – CLAUDE.md

Guidance for working on the **Build** app in this repo.

## Purpose

Create and manage **staking contracts** for Olas: deploy and configure staking contracts (e.g. on Gnosis, Base, Polygon, Optimism, Mode). Target users are operators/developers launching staking.

## Port

**3002**

## Stack

- **Wallet**: Yes. RainbowKit (over Wagmi). See `context/web3ModalProvider.tsx` (filename kept pending a cross-app rename), `components/Layout/Login.tsx`, `components/Login/LoginV2.tsx`.
- **State**: Redux (`store/`).
- **Key libs**: `util-functions`, `util-constants`, `util-contracts`, `ui-theme`, `common-contract-functions`, `ui-components`, `common-middleware`, `util-ssr`.

## Env / backends

- RPCs for supported chains.
- Staking contract subgraphs (Gnosis, Base, Optimism, Polygon, Mode).
- Wallet Project ID for RainbowKit (WalletConnect Cloud projectId — required by `getDefaultConfig`).

## Structure

- `pages/` – Next.js routes.
- `components/` – Build-specific UI (Layout, Login, staking contract creation flow).
- `store/`, `context/`, `util/` or `common-util/` – State and helpers.

## Commands

- Serve: `yarn nx run build:serve`
- Build: `yarn nx run build:build`
- Test: `yarn nx test build`
- Lint: `yarn nx lint build`

## Notes

- Staking contract addresses and ABIs come from `util-contracts` and app config; ensure correct chain when reading/writing.
- SEO: `pages/paths/[id].tsx` is SSR'd (no `getStaticProps`). `common-util/hooks/useFetchPathData.ts` resolves `pathData` **synchronously** (via `useMemo` from `components/Paths/data.json`) so the per-path `<title>`/`<meta>` render server-side for crawlers; only the markdown body is fetched async. Keep `<Meta>` rendered whenever `pathData` exists (including the loading state) — don't move it behind the spinner, or every path page falls back to the default title/description (duplicate-meta regression). `components/Meta.tsx` also emits a canonical link from `path`.
