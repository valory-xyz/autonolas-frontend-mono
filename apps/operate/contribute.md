# Contributing to Operate app

- **General contributing**: See the repo root [contribute.md](../../contribute.md) (branch naming, conventional commits, PR titles, code quality).
- **PR titles**: Use conventional commits (e.g. `feat(operate): add X`, `fix(operate): Y`). Types: [Conventional commit types](https://gist.github.com/qoomon/5dfcdf8eec66a051ecd85625518cfd13#types).

## App-specific

- **Serve**: `yarn nx run operate:serve` → http://localhost:3007
- **Test**: `yarn nx test operate`
- **Lint**: `yarn nx lint operate`
- **Env**: Copy root `.env.example` and set staking subgraph URLs, RPCs, and Wallet Project ID.
