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

## Notes

- Contract interactions and rewards often use `common-contract-functions` (e.g. useRewards, useNominees). Ensure correct chain when reading or writing.
