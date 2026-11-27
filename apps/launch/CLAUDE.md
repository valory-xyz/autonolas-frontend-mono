# Launch app – CLAUDE.md

Base/Polygon staking reads use SQD OpenReader. Configure
`NEXT_PUBLIC_STAKING_POLYGON_SQUID_URL` for Polygon and retain the existing
`NEXT_PUBLIC_STAKING_BASE_SQUID_URL` for Base. Launch does not consume the Marketplace
app's marketplace or registry indexers. See [the per-app deployment table](../../docs/base-polygon-squid-cutover.md).

Guidance for working on the **Launch** app in this repo.

## Purpose

**Launch** and **nominate** staking contracts: create and manage staking contracts, nominate contracts for programs. Users connect a wallet and interact with staking contracts on supported chains (Ethereum, Gnosis, Polygon, Mode, Optimism, Base, Arbitrum, Celo, Robinhood Chain).

## Port

**3005**

## Stack

- **Wallet**: Yes. RainbowKit (over Wagmi). See `context/Web3ModalProvider.tsx` (filename kept pending a cross-app rename), `components/Login/` (LoginV2, SwitchNetworkButton), `components/MyStakingContracts/`, `components/NominateContract/`.
- **State**: Redux (`store/`).
- **Key libs**: `util-constants`, `util-functions`, `util-contracts`, `ui-theme`, `ui-components`, `util-prohibited-data`, `common-middleware`, `util-ssr`.

## Env / backends

- Staking contract subgraphs (Gnosis, Optimism, Mode, Ethereum, Arbitrum, Celo) and the Base/Polygon/Robinhood squids (`NEXT_PUBLIC_STAKING_BASE_SQUID_URL`, `NEXT_PUBLIC_STAKING_POLYGON_SQUID_URL`, `NEXT_PUBLIC_STAKING_ROBINHOOD_SQUID_URL`) in `common-util/graphql/index.ts`; squid chains are listed in `STAKING_SQUID_CHAIN_IDS` (`libs/util-constants`). A chain whose URL is unset gets no client, so `hasSubgraphSupport` is false and `hooks/useGetMyStakingContracts.ts` falls back to `InstanceCreated` logs from the `StakingFactory`, scanned from its deployment block (`blockNumbers` in `common-util/constants/stakingContract.ts`). Chains whose RPC caps the `eth_getLogs` block span (Robinhood: 10,000,000 blocks) are scanned in windows of `LOGS_MAX_BLOCK_SPAN`; without that, a scan from the deployment block exceeds the cap and the list comes back empty. `NEXT_PUBLIC_*` URLs are inlined at build time, so set them before deploying.
- RPCs and Wallet Project ID for RainbowKit (WalletConnect Cloud projectId — required by `getDefaultConfig`).

## Structure

- `pages/` – Next.js routes.
- `components/` – MyStakingContracts (Create, list), NominateContract, Login.
- `hooks/` – e.g. `useGetMyStakingContracts.ts` (mounted once in `_app`): builds the "my staking contracts" list from TanStack queries (addresses keyed by chain + account, metadata keyed by `metadataHash`; keys in `common-util/queries/myStakingContracts.ts`) and publishes it with its owner `{ chainId, account }`, or a loading state, to the `launch` slice. Pages must read it through `useMyStakingContracts()`, which rejects a list whose owner is not the current chain and account during render (never `state.launch.myStakingContracts` directly). Contracts created this session (`recordCreatedStakingContract`, scoped to chain + creator) are merged in until discovery returns them and their metadata resolves from the chain (a failed `metadataHash` read is retried and marked stale, never cached for good); nominations confirmed this session (`recordConfirmedNomination`, recorded as soon as the receipt succeeds) count as nominated until a successful mainnet nominee read (`useNominees`, matched by address and chain ID) includes them. A failed nominee read or refresh makes every unconfirmed contract `unknown`, even when an older nominee list is cached. `nominationStatus` is `loading | unknown | nominated | notNominated`; only `notNominated` may offer a Nominate action. A discovery lookup that still fails after its retries is published as `isMyStakingContractsLookupFailed` (the page offers Retry via `useRetryMyStakingContracts`, never the "no contracts yet" state).
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
- New staking contracts are created from the StakingToken 0.4.0 implementation (`STAKING_TOKEN_ADDRESSES`, pinned by `stakingContract.spec.ts` against the registries deployment globals). Creation first checks `verifyImplementation` on the chain's verifier, so on a chain whose Proposal 17 allowlist switch has not landed yet it fails with "Selected implementation is not verified". Existing contracts keep their implementation. The verifier's `numServicesLimit` is read on-chain (`hooks/useStakingVerifier.ts`).
- Adding a chain: add it to `SUPPORTED_CHAINS` in `common-util/config/wagmi.ts` (route slug is `kebabCase(chain.name)`, e.g. `robinhood-chain`), every address map + `blockNumbers` in `common-util/constants/stakingContract.ts`, `STAKING_FACTORY.addresses` in `libs/util-contracts`, and `RPC_URLS` / `CHAINS` in `libs/util-constants`. Chains missing from `viem/chains` (Robinhood) are defined in `libs/util-constants/src/lib/chains.ts`.
- Wallet session persists across refresh: wagmi config uses `storage: createStorage({ storage: cookieStorage })` and `_app.tsx` feeds `cookieToInitialState(wagmiConfig)` into the provider's `initialState`. Don't gate `WagmiProvider` behind an `isMounted` flag — pages calling `useConfig` at top-render fail SSR/static export when the provider isn't there.
