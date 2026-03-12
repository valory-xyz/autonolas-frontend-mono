# Contributing to Build app

- **General contributing**: See the repo root [CONTRIBUTING.md](../../CONTRIBUTING.md) (branch naming, conventional commits, PR titles, code quality).
- **PR titles**: Use conventional commits (e.g. `feat(build): add X`, `fix(build): Y`). Types: [Conventional commit types](https://gist.github.com/qoomon/5dfcdf8eec66a051ecd85625518cfd13#types).

## App-specific

- **Serve**: `yarn nx run build:serve` → http://localhost:3002
- **Test**: `yarn nx test build`
- **Lint**: `yarn nx lint build`
- **Env**: Copy root `.env.example` and set RPCs, staking subgraph URLs, and Wallet Project ID.
