# Contributing to Bond app

- **General contributing**: See the repo root [CONTRIBUTING.md](../../CONTRIBUTING.md) (branch naming, conventional commits, PR titles, code quality).
- **PR titles**: Use conventional commits (e.g. `feat(bond): add X`, `fix(bond): Y`). Types: [Conventional commit types](https://gist.github.com/qoomon/5dfcdf8eec66a051ecd85625518cfd13#types).

## App-specific

- **Serve**: `yarn nx run bond:serve` → http://localhost:3001
- **Test**: `yarn nx test bond`
- **Lint**: `yarn nx lint bond`
- **Env**: Copy root `.env.example` and fill Bond-related vars (RPCs, Balancer URLs, optional Solana/Shyft).
