# Bond app – CLAUDE.md

Guidance for working on the **Bond** app in this repo.

## Purpose

Bonding products for Olas: buy/sell OLAS and related tokens. Supports **EVM** (Balancer) and **Solana** (Orca Whirlpools, SVM).

## Port

**3001**

## Stack

- **Wallet**: Yes. Web3Modal (EVM) + Solana wallet adapter. See `context/Web3ModalProvider.jsx`, `common-util/Login/`, `common-util/hooks/useSvmConnectivity.jsx`.
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

## Notes

- Some files are still `.jsx`; follow existing patterns when adding or refactoring.
- Solana and EVM flows are both used; ensure the right wallet and network are considered for each feature.
