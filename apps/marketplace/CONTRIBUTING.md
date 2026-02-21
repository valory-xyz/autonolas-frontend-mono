# Contributing to Marketplace app

- **General contributing**: See the repo root [CONTRIBUTING.md](../../CONTRIBUTING.md) (branch naming, conventional commits, PR titles, code quality).
- **PR titles**: Use conventional commits (e.g. `feat(marketplace): add X`, `fix(marketplace): Y`). Types: [Conventional commit types](https://gist.github.com/qoomon/5dfcdf8eec66a051ecd85625518cfd13#types).

## App-specific

- **Serve**: `yarn nx run marketplace:serve` → http://localhost:3006
- **Test**: `yarn nx test marketplace`
- **Lint**: `yarn nx lint marketplace`
- **Env**: Copy root `.env.example` and set registry URL, mech/marketplace/registry subgraphs per chain, Wallet Project ID, RPCs. Optional: Solana/SVM, Etherscan API key. For full registry testing, local registry (Docker) may be needed.
