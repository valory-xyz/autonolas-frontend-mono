# Marketplace app – CLAUDE.md

Guidance for working on the **Marketplace** app in this repo. This app powers the [Olas Mech Marketplace](https://marketplace.olas.network/) and on-chain **Registry** for agents, components, and services.

## Purpose

Discover, register, deploy, and interact with **mechs** (autonomous AI agents) and **registry** entities (agents, components, services) across multiple chains. Users connect a wallet (WalletConnect/Web3Modal) to register, deploy, or use mechs. Multi-chain: Ethereum, Gnosis, Polygon, Arbitrum, Optimism, Base, Mode, Celo. Also supports **Solana (SVM)**.

## Port

**3006**

## Stack

- **Wallet**: Web3Modal (Wagmi) for EVM chains; Solana wallet adapter for SVM. See `pages/_app.tsx`, `common-util/Login/LoginV2.jsx`, `common-util/hooks/useSvmConnectivity.jsx`, `common-util/hooks/useHelpers.tsx`.
- **State**: Redux Toolkit (`store/setup.ts`, `store/service.ts`).
- **Key libs**: `util-functions`, `util-contracts`, `util-constants`, `ui-components`, `common-contract-functions`, `ui-theme`, `util-prohibited-data`, `common-middleware`, `util-ssr`.

## Env / Backends

- **Registry**: `NEXT_PUBLIC_REGISTRY_URL`, `NEXT_PUBLIC_AUTONOLAS_URL`; Safe APIs per chain.
- **Marketplace activity subgraphs** (per chain): `NEXT_PUBLIC_*_MARKETPLACE_SUBGRAPH_URL` for Ethereum (1), Optimism (10), Gnosis (100), Polygon (137), Base (8453), Arbitrum (42161), Celo (42220).
- **Registry subgraphs**: Ethereum (1), Optimism (10), Gnosis (100), Polygon (137), Base (8453), Mode (34443), Arbitrum (42161), Celo (42220).
- **Etherscan** API key; **Wallet Project ID**; optional **Solana** (SVM) config.
- Optional: local registry via Docker (see app README).

## Routes

All pages use dynamic `[network]` routing (e.g., `/ethereum/ai-agents`).

| Route | Purpose |
|-------|---------|
| `/` | Home/landing |
| `/[network]` | Network dashboard |
| `/[network]/ai-agents` | List all services (AI agents) |
| `/[network]/ai-agents/[id]` | Service detail page (SSR metadata) |
| `/[network]/ai-agents/mint` | Register/mint a new service |
| `/[network]/ai-agents/update/[id]` | Update existing service |
| `/[network]/agent-blueprints` | List agent blueprints (L1 only) |
| `/[network]/agent-blueprints/[id]` | Agent blueprint details |
| `/[network]/agent-blueprints/mint` | Mint agent blueprint |
| `/[network]/components` | List components (L1 only) |
| `/[network]/components/[id]` | Component details |
| `/[network]/components/mint` | Mint component |

### API Routes

| Route | Purpose |
|-------|---------|
| `/api/services` | Fetch services from marketplace subgraph (per chain) |
| `/api/service-activity` | Fetch mech request/delivery activity from marketplace subgraph |
| `/api/erc8004/[network]/ai-agents/[serviceId]` | ERC8004 registration metadata |
| `/api/erc8004/[network]/ai-agents/[serviceId]/agent-card.json` | A2A agent card |
| `/api/erc8004/[network]/ai-agents/[serviceId]/mcp.json` | MCP server descriptor |

## Structure

- `pages/` – Next.js routes (dynamic `[network]` param).
- `components/` – Main UI: `ListServices/`, `ListAgents/`, `ListComponents/`, `Login/`.
- `common-util/` – Shared utilities, hooks, contract ABIs, GraphQL queries, IPFS helpers.
- `store/` – Redux slices (`setup.ts` for wallet state, `service.ts` for agent instances).
- `types/` – TypeScript type definitions.

## Key Features

### ERC8004 Metadata Standard

ERC8004 is a token metadata standard for autonomous agents. The app exposes API endpoints that generate:

- **Registration response** (`/api/erc8004/...`) – Standard ERC8004 registration with name, description, image, services, x402 support, and registration info.
- **Agent Card** (`agent-card.json`) – A2A-compatible agent card with skills derived from IPFS tool metadata.
- **MCP Descriptor** (`mcp.json`) – Model Context Protocol server descriptor with tools.

**Key files:**
- `common-util/functions/erc8004Helpers.ts` – `getChainIdFromNetworkSlug()`, `normalizeToolSchema()`, `getAgentCardUrl()`, `getMcpJsonUrl()`
- `pages/api/erc8004/` – API route handlers
- `common-util/graphql/registry.ts` – Subgraph query includes `erc8004Agent` field

**Supported ERC8004 chains:** Ethereum (1), Optimism (10), Gnosis (100), Polygon (137), Base (8453), Arbitrum (42161), Celo (42220).

### Service Lifecycle (State Machine)

Services have 6 states with step-by-step UI in `components/ListServices/ServiceState/`:

| State | Value | Step Component | Actions |
|-------|-------|----------------|---------|
| Non Existent | 0 | – | – |
| Pre Registration | 1 | `1StepPreRegistration` | Initial creation |
| Active Registration | 2 | `2StepActiveRegistration` | Register agents with bonds |
| Finished Registration | 3 | `3rdStepFinishedRegistration` | Deploy service instances |
| Deployed | 4 | `4thStepDeployed` | Service is live |
| Terminated Bonded | 5 | `5StepUnbond` | Unbond and terminate |

**Key state functions** in `ServiceState/utils.jsx`: `getBonds()`, `onActivateRegistration()`, `onStep2RegisterAgents()`, `onStep3Deploy()`, `onTerminate()`, `onStep5Unbond()`.

### Mech Marketplace Activity

Tracks **requests** (demand) and **deliveries** (supply) for mech services.

- **Activity types:** `Demand` (from requests) or `Supply` (from deliveries).
- **Fee units:** `NATIVE`, `TOKEN` (OLAS), `USDC`, `CREDITS`.
- **Payment fields:** `feeRaw`, `feeUSD`, `finalFeeUSD`, `feeUnit` (with legacy `payment` fallback).
- **Service roles:** `Registered`, `Demand`, `Supply`, `Demand & Supply` – based on totalRequests/totalDeliveries.
- **Supported chains:** use `isMarketplaceSupportedNetwork()` and `MARKETPLACE_SUPPORTED_CHAIN_IDS` in `util/constants.ts` (all chains with a marketplace activity subgraph URL).

**Key files:**
- `common-util/graphql/index.ts` – `MARKETPLACE_SUBGRAPH_CLIENTS`, `MarketplaceSubgraphChainId`
- `common-util/graphql/service-activity.ts` – Activity queries
- `common-util/graphql/services.ts` – Service list queries
- `common-util/Details/ActivityDetails.tsx` – Activity detail modal
- `common-util/types/index.ts` – `Activity`, `Request`, `Delivery`, `FeeUnit` types

### Registry (Agents, Components, Services)

- **Agent blueprints** and **components** are L1-only (Ethereum mainnet).
- **Services** exist on all supported chains (L1 + L2).
- Registration flows: mint agent, mint component, mint service, update service.
- Each entity has IPFS metadata (name, description, image, code_uri, attributes).

### Smart Contracts

| Contract | Purpose |
|----------|---------|
| `SERVICE_REGISTRY_CONTRACT` | Main L1 service registry |
| `SERVICE_REGISTRY_L2` | L2 service registry |
| `SERVICE_MANAGER_CONTRACT` | Service creation/update/termination |
| `SERVICE_REGISTRY_TOKEN_UTILITY_CONTRACT` | Token bonding |
| `AGENT_REGISTRY_CONTRACT` | Agent registration (L1) |
| `COMPONENT_REGISTRY_CONTRACT` | Component registration (L1) |
| `GENERIC_ERC20` | Token approvals |

**Key contract methods:** `exists()`, `getService()`, `ownerOf()`, `tokenURI()`, `getAgentParams()`, `create()`, `activateRegistration()`, `registerAgents()`, `deploy()`, `terminate()`, `unbond()`.

**Addresses:** `common-util/Contracts/addresses.tsx` – per-chain addresses for all contracts.

### Multi-chain Support

- **EVM chains (8):** Ethereum (1), Gnosis (100), Polygon (137), Arbitrum (42161), Base (8453), Optimism (10), Celo (42220), Mode (34443).
- **SVM:** Solana (mainnet-beta).
- `isL1Network()` distinguishes L1 (mainnet) from L2 for contract selection.
- Routes use network slug: `ethereum`, `gnosis`, `polygon`, `arbitrum-one`, `base`, `optimism`, `celo`, `mode`.

### SVM/Solana Support

- IDL: `common-util/AbiAndAddresses/ServiceRegistrySolana.json`.
- Program address: `AU428Z7KbjRMjhmqWmQwUta2AvydbpfEZNBh8dStHTDi`.
- Hook: `useSvmConnectivity()` – Anchor program setup, wallet connection.
- Redux store tracks `vmType` (EVM or SVM).

### IPFS & Metadata

- Gateway: `https://gateway.autonolas.tech/ipfs/`.
- `getIpfsResponse()` – Fetch JSON from IPFS.
- `imageIpfsToGatewayUrl()` – Convert `ipfs://` URLs to gateway URLs.
- `validateMetaImageUrl()` – Security: only allow gateway URL or relative paths.
- Server-side metadata: `common-util/functions/serverSideMetadata.ts` – Used for SSR/SEO on detail pages.

### Agent Identity

- `computeAgentId()` – keccak256 of chainId + tokenId.
- `generateName()` – Deterministic phonetic name from agent ID (e.g., "ba-ke42").

### API Caching

- In-memory LRU cache (max 100 entries).
- Default TTL: 6 hours; stale fallback up to 24 hours.
- Cache-Control: `s-maxage` on API responses.

## Custom Hooks

| Hook | Location | Purpose |
|------|----------|---------|
| `useHelpers()` | `common-util/hooks/useHelpers.tsx` | Account, vmType, chainId, isL1, links |
| `useSvmConnectivity()` | `common-util/hooks/useSvmConnectivity.jsx` | Solana wallet/program setup |
| `useHandleRoute()` | `common-util/hooks/useHandleRoute.ts` | Navigation with chain awareness |
| `useMetadata()` | `components/ListServices/hooks/` | Fetch NFT image from token URI |
| `useSubgraph()` | `components/ListServices/hooks/` | Generic subgraph querying |
| `useService()` | `components/ListServices/hooks/` | Service details, owner, token URI |
| `useServicesList()` | `components/ListServices/hooks/` | All/my services with search |
| `usePaginationParams()` | `components/ListServices/hooks/` | URL-based pagination state |

## Commands

- Serve: `yarn nx run marketplace:serve`
- Build: `yarn nx run marketplace:build`
- Test: `yarn nx test marketplace`
- Lint: `yarn nx lint marketplace`

## Notes

- **WalletConnect/Web3Modal is required** for core flows (registration, deployments, transactions).
- Multi-chain: always consider which chain and which subgraph/registry URL a feature uses.
- Some code is still `.jsx`; follow existing patterns when editing those files.
- L1-only features (agents, components) must check `isL1Network()`.
- Marketplace activity features available on chains in `MARKETPLACE_SUPPORTED_CHAIN_IDS`.
- ERC8004 endpoints are server-side API routes; they fetch from registry subgraph + IPFS.
