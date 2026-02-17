# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is an Nx-based monorepo for Olas frontend applications. It contains multiple Next.js applications that share common libraries and utilities.

**Live Applications:**
- Bond: https://bond.olas.network/
- Build: https://build.olas.network/
- Contribute: https://contribute.olas.network/
- Docs: https://docs.olas.network/
- Govern: https://govern.olas.network/
- Launch: https://launch.olas.network/
- Mech Marketplace: https://marketplace.olas.network/
- Operate: https://operate.olas.network/

## Installation

Install dependencies using Yarn (required - this project uses Yarn, not npm):
```bash
yarn
```

## Development Commands

### Running Applications

Start a development server (default port 4200, but each app has its own port defined in project.json):
```bash
npx nx run <app-name>:serve
```

Development server ports:
- docs: 3000
- bond: 3001
- build: 3002
- contribute: 3003
- govern: 3004
- launch: 3005
- marketplace: 3006
- operate: 3007
- pearl-api: 3010

### Building

Build an application for production:
```bash
npx nx run <app-name>:build
```

Build all applications:
```bash
npx nx run-many --target=build --all
```

### Testing

Run tests for a specific app or library:
```bash
npx nx test <app-or-lib-name>
```

Run tests with coverage:
```bash
npx nx test <app-or-lib-name> --coverage
```

### Linting

Lint a specific app or library:
```bash
yarn nx lint <app-or-lib-name>
```

### Cache Management

Clear the Nx cache if you encounter build issues:
```bash
npx nx reset
```

## Architecture

### Monorepo Structure

The repository is organized into:
- `apps/`: Individual Next.js applications
- `libs/`: Shared libraries and utilities

### Applications

Each app in `apps/` is a standalone Next.js application with:
- `pages/`: Next.js pages with file-based routing
- `components/`: React components specific to the app
- `store/`: Redux state management (using Redux Toolkit)
- `context/`: React context providers
- `common-util/` or `util/`: App-specific utilities
- `types/`: TypeScript type definitions
- `public/`: Static assets
- `next.config.js`: Next.js configuration with styled-components compiler
- `project.json`: Nx project configuration

### Shared Libraries

Libraries in `libs/` follow Nx naming conventions:

**UI Libraries:**
- `ui-components`: Reusable React components (Footer, AddressLink, NavDropdown, etc.)
- `ui-theme`: Theme provider and global styles (AutonolasThemeProvider, GlobalStyles)

**Utility Libraries:**
- `util-functions`: Common utilities (sendTransaction, formValidations, notifications, ethers helpers, numbers)
- `util-constants`: Shared constants
- `util-contracts`: Smart contract ABIs and addresses (TOKENOMICS, STAKING_TOKEN, VOTE_WEIGHTING)
- `util-prohibited-data`: Data validation utilities
- `util-ssr`: Server-side rendering utilities

**Feature Libraries:**
- `feature-service-status-info`: Service status information feature
- `common-contract-functions`: Shared contract interaction functions (useRewards, rewards, useNominees, useNomineesMetadata)
- `common-middleware`: Shared middleware for Next.js applications

### State Management

Apps use Redux Toolkit for state management:
- Store setup follows a consistent pattern with `createSlice`
- Common state slices include `setup` (account, balance, chainId)
- State is app-specific, not shared across apps

### Styling

- Styled-components for CSS-in-JS
- Ant Design (antd) UI framework
- Theme configuration in `libs/ui-theme`
- Global styles applied via AutonolasThemeProvider

### Web3 Integration

- Wagmi for Ethereum interactions (using wagmi v2.x)
- Multiple chain support (Mainnet, Gnosis, Polygon, Arbitrum, Optimism, Base, Mode, Celo)
- Solana support via @solana/web3.js and @solana/wallet-adapter
- Web3Modal for wallet connections
- Ethers v6 as primary, ethers v5 available as `ethers-v5` alias

### Environment Configuration

Environment variables are prefixed with `NEXT_PUBLIC_` for client-side access. Each app has specific requirements:
- RPC URLs for different chains (Mainnet, Gnosis, Polygon, Arbitrum, etc.)
- Subgraph URLs for data indexing
- API keys (Wallet Project ID, Etherscan, etc.)
- App-specific variables (see .env.example for complete list)

## Creating New Apps and Libraries

Generate a new React app:
```bash
npx nx generate @nx/react:app apps/<app-name>
```

Generate a React library:
```bash
npx nx generate @nx/react:library libs/<lib-name>
```
- Bundler: vite
- Testing framework: jest

Generate a JavaScript library:
```bash
npx nx generate @nx/js:library libs/<lib-name>
```

## Import Paths

The monorepo uses TypeScript path aliases configured in `tsconfig.base.json`:
- Shared libraries: `@autonolas-frontend-mono/<lib-name>`
- Within apps: relative imports or aliases like `components/`, `util/`, `store/`, `context/`, `types/`

### Import Order

ESLint enforces import ordering (configured in .eslintrc.json):
1. Third-party modules
2. @autonolas/* packages
3. libs/* imports
4. Local aliases (store, util, common-util, components, data, hooks, context, types)
5. Relative imports

## Code Style

- Prettier formatting with:
  - Single quotes
  - 100 character line width
  - Semicolons required
  - Trailing commas
- TypeScript strict mode enabled
- Console statements: only `console.warn` and `console.error` allowed (no console.log)
- ESLint extends next/core-web-vitals and prettier

## Testing

- Jest for unit testing
- React Testing Library for component tests
- Test files: `*.spec.ts`, `*.spec.tsx`, `*.test.ts`, `*.test.tsx`
- Configuration: Each app/lib has its own `jest.config.js/ts`
- Pass with no tests: enabled by default

## Key Dependencies

- React 18.2.0
- Next.js 14.2.35
- TypeScript 5.2.2
- Nx v17.2.5
- Redux Toolkit
- Wagmi 2.5.19 / Viem 2.37.5
- Ethers v6 (and v5 as ethers-v5)
- Ant Design 5.9.0
- Styled-components 6.0.7

## Contributing

- See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.
- Use **conventional commits** for commit messages and PR titles (e.g. `feat:`, `fix:`, `docs:`). Types: [Conventional commit types](https://gist.github.com/qoomon/5dfcdf8eec66a051ecd85625518cfd13#types).

## Notes

- Nx workspace with caching enabled for builds, lints, tests
- Next.js apps configured with styled-components compiler
- Multiple blockchain networks supported
- Each app is independently deployable
- Shared code should be extracted to libs/ to maintain separation
- Use **Yarn** preferably for install and scripts
