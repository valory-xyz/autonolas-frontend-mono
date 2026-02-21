# Marketplace app – CLAUDE.md

Guidance for working on the **Marketplace** app in this repo. This app powers the [Olas Registry](https://registry.olas.network/) and **Mech Marketplace**.

## Purpose

Discover and interact with **mechs** and **registry** services across multiple chains. Users connect a wallet (WalletConnect/Web3Modal) to register, deploy, or use mechs. Multi-chain: Ethereum, Gnosis, Polygon, Arbitrum, Optimism, Base, Mode, Celo (subgraphs and registry per chain).

## Port

**3006**

## Stack

- **Wallet**: Yes. **Web3Modal (Wagmi)** and **Solana** where applicable. See `pages/_app.tsx`, `common-util/Login/LoginV2.jsx`, `common-util/hooks/useSvmConnectivity.jsx`, `common-util/hooks/useHelpers.tsx`, `components/Login/`.
- **State**: Redux (`store/`).
- **Key libs**: `util-functions`, `util-contracts`, `util-constants`, `ui-components`, `common-contract-functions`, `ui-theme`, `util-prohibited-data`, `common-middleware`, `util-ssr`.

## Env / backends

- **Registry**: `NEXT_PUBLIC_REGISTRY_URL`, `NEXT_PUBLIC_AUTONOLAS_URL`; Safe APIs per chain.
- **Mech subgraph**: `NEXT_PUBLIC_MECH_SUBGRAPH_URL`; marketplace subgraphs (Gnosis, Base, etc.).
- **Registry subgraphs** per chain: Ethereum, Optimism, Gnosis, Polygon, Base, Mode, Arbitrum, Celo.
- **Etherscan** API key; **Wallet Project ID**; optional **Solana** (SVM) config.
- Optional: local registry via Docker (see app README).

## Structure

- `pages/` – Next.js routes.
- `components/` – Marketplace/registry UI, Login.
- `common-util/` – Login, SVM connectivity, helpers (some `.jsx`).
- `store/`, `context/`, `types/`.

## Commands

- Serve: `yarn nx run marketplace:serve`
- Build: `yarn nx run marketplace:build`
- Test: `yarn nx test marketplace`
- Lint: `yarn nx lint marketplace`

## Notes

- **WalletConnect/Web3Modal is required** for core flows (registration, deployments, transactions). Docs app does not use a wallet; this app does.
- Multi-chain: always consider which chain and which subgraph/registry URL a feature uses.
- Some code is still `.jsx`; follow existing patterns.
