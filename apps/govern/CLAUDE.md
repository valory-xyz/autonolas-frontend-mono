# Govern app – CLAUDE.md

Guidance for working on the **Govern** app in this repo.

## Purpose

Olas governance: **voting**, **veOLAS**, **proposals**, **donations**, and **vote delegation**. Users connect a wallet to view proposals, vote, delegate voting power, and manage veOLAS (approve, lock, etc.).

## Port

**3004**

## Stack

- **Wallet**: Web3Modal (Wagmi). See `context/Web3ModalProvider.tsx`, `components/Login/`, `components/Contracts/`, `components/Donate/`, `components/Proposals/`, `components/VeOlas/`.
- **State**: Redux (`store/`).
- **Key libs**: `util-constants`, `util-functions`, `util-contracts`, `ui-theme`, `ui-components`, `util-prohibited-data`, `common-contract-functions`, `common-middleware`, `util-ssr`.

## Env / backends

- **Governor subgraph**: `NEXT_PUBLIC_GOVERNOR_SUBGRAPH_URL`
- RPCs and Wallet Project ID for Web3Modal.

## Structure

- `pages/` – Next.js routes.
- `components/` – Contracts (MyVotingWeight, EditVotes, RevokePower), Donate, Proposals, Epoch, VeOlas, Login, Layout (Balance).
- `hooks/` – e.g. `useFetchBalances`, `useFetchUserVotes`.
- `store/`, `context/`, `common-util/` (e.g. `resetState`).

## Commands

- Serve: `yarn nx run govern:serve`
- Build: `yarn nx run govern:build`
- Test: `yarn nx test govern`
- Lint: `yarn nx lint govern`

## Notes

- Voting and delegation logic depends on governor contracts and subgraph; ensure correct chain and subgraph URL.
- Balance and vote displays are wallet/contract-driven.
