# Launch app – CLAUDE.md

Guidance for working on the **Launch** app in this repo.

## Purpose

**Launch** and **nominate** staking contracts: create and manage staking contracts, nominate contracts for programs. Users connect a wallet and interact with staking contracts on supported chains (e.g. Gnosis, Base, Mode).

## Port

**3005**

## Stack

- **Wallet**: Yes. RainbowKit (over Wagmi). See `context/Web3ModalProvider.tsx` (filename kept pending a cross-app rename), `components/Login/` (LoginV2, SwitchNetworkButton), `components/MyStakingContracts/`, `components/NominateContract/`.
- **State**: Redux (`store/`).
- **Key libs**: `util-constants`, `util-functions`, `util-contracts`, `ui-theme`, `ui-components`, `util-prohibited-data`, `common-middleware`, `util-ssr`.

## Env / backends

- Staking contract subgraphs (Gnosis, Base, Optimism, Polygon, Mode).
- RPCs and Wallet Project ID for RainbowKit (WalletConnect Cloud projectId — required by `getDefaultConfig`).

## Structure

- `pages/` – Next.js routes.
- `components/` – MyStakingContracts (Create, list), NominateContract, Login.
- `hooks/` – e.g. `useGetMyStakingContracts.ts`.
- `store/`, `context/`.

## Commands

- Serve: `yarn nx run launch:serve`
- Build: `yarn nx run launch:build`
- Test: `yarn nx test launch`
- Lint: `yarn nx lint launch`

## Path page rendering (`/path`, and `/` redirects here)

This page fetches nothing — the steps are static React components. The risk is different from
the other apps: it used to render only `steps[step].content`, so the served HTML carried one step
of six and no sign the rest existed. A crawler fetches the page once and never clicks.

- **All six steps are rendered.** Inactive ones use the `hidden` attribute, which keeps them in
  the HTML while removing them from both the visual render and the accessibility tree — so
  crawlers get every step and a screen-reader user does not hear all six at once. `.sr-only`
  would have been wrong here for that second reason.
- The visible page is unchanged: exactly one panel is visible, still `steps[0]` on first render.
- **Rendering every step runs every step's hooks.** `Engage` reads Redux, so any test rendering
  `PathPage` needs its own `<Provider>`; `_app.tsx` supplies one in the app.
- Guarded by `PathPage.prerender.spec.tsx` (runs in CI) and by
  `yarn check:served-text launch` against built HTML, which asserts every step title is served.

## Notes

- Staking contract creation and nomination are chain-specific; use correct network and subgraph for the target chain.
- Wallet session persists across refresh: wagmi config uses `storage: createStorage({ storage: cookieStorage })` and `_app.tsx` feeds `cookieToInitialState(wagmiConfig)` into the provider's `initialState`. Don't gate `WagmiProvider` behind an `isMounted` flag — pages calling `useConfig` at top-render fail SSR/static export when the provider isn't there.
