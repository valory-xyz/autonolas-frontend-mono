# Contributing to Govern app

- **General contributing**: See the repo root [CONTRIBUTING.md](../../CONTRIBUTING.md) (branch naming, conventional commits, PR titles, code quality).
- **PR titles**: Use conventional commits (e.g. `feat(govern): add X`, `fix(govern): Y`). Types: [Conventional commit types](https://gist.github.com/qoomon/5dfcdf8eec66a051ecd85625518cfd13#types).

## App-specific

- **Serve**: `yarn nx run govern:serve` → http://localhost:3004
- **Test**: `yarn nx test govern`
- **Lint**: `yarn nx lint govern`
- **Env**: Copy root `.env.example` and set governor subgraph URL, RPCs, and Wallet Project ID.
