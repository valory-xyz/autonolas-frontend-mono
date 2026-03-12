# Launch app – CLAUDE.md

Guidance for working on the **Launch** app in this repo.

## Purpose

**Launch** and **nominate** staking contracts: create and manage staking contracts, nominate contracts for programs. Users connect a wallet and interact with staking contracts on supported chains (e.g. Gnosis, Base, Mode).

## Port

**3005**

## Stack

- **Wallet**: Yes. Web3Modal (Wagmi). See `context/Web3ModalProvider.tsx`, `components/Login/` (LoginV2, SwitchNetworkButton), `components/MyStakingContracts/`, `components/NominateContract/`.
- **State**: Redux (`store/`).
- **Key libs**: `util-constants`, `util-functions`, `util-contracts`, `ui-theme`, `ui-components`, `util-prohibited-data`, `common-middleware`, `util-ssr`.

## Env / backends

- Staking contract subgraphs (Gnosis, Base, Optimism, Polygon, Mode).
- RPCs and Wallet Project ID for Web3Modal.

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

## Notes

- Staking contract creation and nomination are chain-specific; use correct network and subgraph for the target chain.
