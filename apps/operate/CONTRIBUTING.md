# Contributing to Operate app

- **General contributing**: See the repo root [CONTRIBUTING.md](../../CONTRIBUTING.md) (branch naming, conventional commits, PR titles, code quality).
- **PR titles**: Use conventional commits (e.g. `feat(operate): add X`, `fix(operate): Y`). Types: [Conventional commit types](https://gist.github.com/qoomon/5dfcdf8eec66a051ecd85625518cfd13#types).

## App-specific

- **Serve**: `yarn nx run operate:serve` → http://localhost:3007
- **Test**: `yarn nx test operate`
- **Lint**: `yarn nx lint operate`
- **Env**: Copy root `.env.example` and set staking indexer URLs, RPCs, and Wallet Project ID.

## Staking indexer configuration

Set `NEXT_PUBLIC_STAKING_POLYGON_SQUID_URL` for Polygon and retain
`NEXT_PUBLIC_STAKING_BASE_SQUID_URL` for Base. Other supported chains keep their existing
staking subgraph variables. This app does not require marketplace or registry indexer variables.
Configure before building, then rebuild/redeploy. See [the per-app deployment table](../../docs/base-polygon-squid-cutover.md).
