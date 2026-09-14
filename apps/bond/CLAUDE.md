# Bond app – CLAUDE.md

Guidance for working on the **Bond** app in this repo.

## Purpose

Bonding products for Olas: buy/sell OLAS and related tokens. Supports **EVM** (Balancer) and **Solana** (Orca Whirlpools, SVM).

## Port

**3001**

## Stack

- **Wallet**: Yes. RainbowKit (over Wagmi, EVM) + Solana wallet adapter. See `context/Web3ModalProvider.jsx` (filename kept pending a cross-app rename), `common-util/Login/`, `common-util/hooks/useSvmConnectivity.jsx`.
- **State**: Redux (`store/`).
- **Key libs**: `ui-components`, `ui-theme`, `util-functions`, `util-contracts`, `util-constants`, `util-prohibited-data`, `util-ssr`, `common-middleware`.

## Env / backends

- RPCs: Mainnet, Gnosis, Polygon, Arbitrum, Optimism, Base, Solana.
- Balancer URLs per chain (see root `.env.example` – bond section).
- Optional: Shyft API, Solana config.

## Structure

- `pages/` – Next.js routes.
- `components/` – Bond-specific UI (e.g. Bonding, TokenManagement, WsolDeposit/WsolWithdraw).
- `common-util/` – Login, SVM connectivity, token/balance helpers.
- `store/`, `context/`, `types/` – State and types.

## Commands

- Serve: `yarn nx run bond:serve`
- Build: `yarn nx run bond:build`
- Test: `yarn nx test bond`
- Lint: `yarn nx lint bond`

## Server rendering (`useHelpers` and the Layout gate)

Every page in this app used to serve only its nav and disclaimer — 412 characters — because
`components/Layout/index.jsx` renders the page body only when `chainId` is set, and `chainId`
lives in Redux, populated by an effect in `useHelpers`. On the server it was always null.

- `useHelpers` now falls back to `SUPPORTED_CHAINS[0].id` when Redux has no chain yet. That is
  what `getChainId` itself resolves to for a visitor with no wallet — which includes every
  crawler — and a connected wallet still wins as soon as the effect lands.
- **Default in the hook, not in the gate.** Opening the gate alone would let children render
  with a null chainId, and `ADDRESSES[chainId].depository` (`common-util/Contracts/params.js`,
  and several places in `useBondingList`) would throw during the server render.
- The `NoProducts` empty state describes what the table lists. It renders server-side before the
  client has fetched anything, so a bare "No products" told crawlers Olas has none at all.
- Guarded by `yarn check:served-text --url <host> bond`. Bond renders per request, so there is
  no build output to inspect — point it at a running server or a deployment.

**Still client-only:** the product rows themselves. `useBondingList` is a ~613-line hook chain
spanning depository reads, Balancer and Uniswap LP pricing across six chains, and a Solana
whirlpool path that uses wallet-adapter hooks rather than plain functions. `/bonding-products`
currently serves the table structure and the empty-state prose, not the products.

## Notes

- Some files are still `.jsx`; follow existing patterns when adding or refactoring.
- SEO: pages set per-page titles/descriptions via `components/Meta.tsx`, which also emits a `<link rel="canonical">` from `pageUrl` (query-string-free). Give each page a distinct `pageTitle` (the home page intentionally uses the bare `Olas Bond` brand title).
- Solana and EVM flows are both used; ensure the right wallet and network are considered for each feature.
