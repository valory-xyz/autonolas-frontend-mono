# Autonolas Frontend Mono

Monorepo for Olas (Autonolas) frontends. Built with **Nx** and **Next.js**; we preferably use **Yarn** for installs and scripts.

## Applications

| App | Port | Description |
|-----|------|-------------|
| [Bond](https://bond.olas.network/) | 3001 | Bonding products (EVM + Solana) |
| [Build](https://build.olas.network/) | 3002 | Staking contract builder |
| [Contribute](https://contribute.olas.network/) | 3003 | Contributions, staking, backend integration |
| [Docs](https://docs.olas.network/) | 3000 | Documentation site (no wallet) |
| [Govern](https://govern.olas.network/) | 3004 | Governance, voting, veOLAS |
| [Launch](https://launch.olas.network/) | 3005 | Launch and nominate staking contracts |
| [Marketplace](https://marketplace.olas.network/) | 3006 | Mech marketplace & [Registry](https://registry.olas.network/) (WalletConnect) |
| [Operate](https://operate.olas.network/) | 3007 | Operate staking contracts |
| [Pearl API](https://pearl.olas.network/) | 3010 | API (Zendesk, achievements, Web3Auth) |

Apps differ by stack: some need **WalletConnect/Web3** (e.g. Bond, Build, Govern, Launch, Marketplace, Operate, Contribute); **Docs** is static; **Pearl API** is API + Web3Auth. See each app’s `CLAUDE.md` and `contribute.md` for details.

## Quick start

```bash
yarn
yarn nx run <app-name>:serve
```

Open the app at `http://localhost:<port>` (see table above).

## Architecture (high level)

- **apps/** – Next.js apps; each has its own pages, components, Redux store, and optional wallet/backend.
- **libs/** – Shared code: `ui-components`, `ui-theme`, `util-functions`, `util-contracts`, `util-constants`, `common-contract-functions`, `common-middleware`, `util-ssr`, and feature libs. Shared logic lives here; apps stay thin.
- **State** – Redux Toolkit per app; Wagmi/Web3Modal where a wallet is required.
- **Styling** – styled-components + Ant Design; theme from `libs/ui-theme`.

See [CLAUDE.md](CLAUDE.md) for detailed architecture, commands, and conventions.

## Commands

| Task | Command |
|------|---------|
| Serve app | `yarn nx run <app-name>:serve` |
| Build app | `yarn nx run <app-name>:build` |
| Test | `yarn nx test <app-name>` |
| Lint | `yarn nx lint <app-name>` |
| Lint fix | `yarn nx lint <app-name> --fix` |
| Clear cache | `yarn nx reset` |

## Contributing

- Use **conventional commits** for commits and **PR titles** (e.g. `feat:`, `fix:`, `docs:`).  
  Types: [Conventional commit types](https://gist.github.com/qoomon/5dfcdf8eec66a051ecd85625518cfd13#types).
- Full guidelines: [contribute.md](contribute.md).

## License
![MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
