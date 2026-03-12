# Contributing to Pearl API app

- **General contributing**: See the repo root [CONTRIBUTING.md](../../CONTRIBUTING.md) (branch naming, conventional commits, PR titles, code quality).
- **PR titles**: Use conventional commits (e.g. `feat(pearl-api): add X`, `fix(pearl-api): Y`). Types: [Conventional commit types](https://gist.github.com/qoomon/5dfcdf8eec66a051ecd85625518cfd13#types).

## App-specific

- **Serve**: `yarn nx run pearl-api:serve` → http://localhost:3010
- **Test**: `yarn nx test pearl-api`
- **Lint**: `yarn nx lint pearl-api`
- **Env**: Copy root `.env.example` and set Web3Auth client ID, allowed origin, and (for Zendesk) subdomain, API token, and email.
