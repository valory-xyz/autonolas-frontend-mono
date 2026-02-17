# Contributing to Launch app

- **General contributing**: See the repo root [contribute.md](../../contribute.md) (branch naming, conventional commits, PR titles, code quality).
- **PR titles**: Use conventional commits (e.g. `feat(launch): add X`, `fix(launch): Y`). Types: [Conventional commit types](https://gist.github.com/qoomon/5dfcdf8eec66a051ecd85625518cfd13#types).

## App-specific

- **Serve**: `yarn nx run launch:serve` → http://localhost:3005
- **Test**: `yarn nx test launch`
- **Lint**: `yarn nx lint launch`
- **Env**: Copy root `.env.example` and set staking contract subgraph URLs, RPCs, and Wallet Project ID.
