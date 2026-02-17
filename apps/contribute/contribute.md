# Contributing to Contribute app

- **General contributing**: See the repo root [contribute.md](../../contribute.md) (branch naming, conventional commits, PR titles, code quality).
- **PR titles**: Use conventional commits (e.g. `feat(contribute): add X`, `fix(contribute): Y`). Types: [Conventional commit types](https://gist.github.com/qoomon/5dfcdf8eec66a051ecd85625518cfd13#types).

## App-specific

- **Serve**: `yarn nx run contribute:serve` → http://localhost:3003
- **Test**: `yarn nx test contribute`
- **Lint**: `yarn nx lint contribute`
- **Env**: Copy root `.env.example` and set backend URL, PFP, Discord, AFMDB, and (for server-side features) agent DB vars. Wallet Project ID and RPCs for frontend.
