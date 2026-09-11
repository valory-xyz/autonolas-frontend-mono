# Marketplace app – CLAUDE.md

Guidance for working on the **Marketplace** app in this repo. This app powers the [Olas Mech Marketplace](https://marketplace.olas.network/) and on-chain **Registry** for agents, components, and services.

## Purpose

Discover, register, deploy, and interact with **mechs** (autonomous AI agents) and **registry** entities (agents, components, services) across multiple chains. Users connect a wallet (RainbowKit, via WalletConnect/MetaMask/Coinbase/Safe) to register, deploy, or use mechs. Multi-chain: Ethereum, Gnosis, Polygon, Arbitrum, Optimism, Base, Mode, Celo. Also supports **Solana (SVM)**.

## Port

**3006**

## Stack

- **Wallet**: RainbowKit (over Wagmi) for EVM chains; Solana wallet adapter for SVM. See `pages/_app.tsx` (RainbowKitProvider), `common-util/Login/config.tsx` (`getDefaultConfig`), `common-util/Login/LoginV2.jsx`, `common-util/hooks/useSvmConnectivity.jsx`, `common-util/hooks/useHelpers.tsx`.
- **State**: Redux Toolkit (`store/setup.ts`, `store/service.ts`).
- **Key libs**: `util-functions`, `util-contracts`, `util-constants`, `ui-components`, `common-contract-functions`, `ui-theme`, `util-prohibited-data`, `common-middleware`, `util-ssr`.

## Env / Backends

- **Registry**: `NEXT_PUBLIC_REGISTRY_URL`, `NEXT_PUBLIC_AUTONOLAS_URL`; Safe APIs per chain.
- **Marketplace activity subgraphs** (per chain): `NEXT_PUBLIC_*_MARKETPLACE_SUBGRAPH_URL` for Ethereum (1), Optimism (10), Gnosis (100), Polygon (137), Base (8453), Arbitrum (42161), Celo (42220).
- **Registry subgraphs**: Ethereum (1), Optimism (10), Gnosis (100), Polygon (137), Base (8453), Mode (34443), Arbitrum (42161), Celo (42220).
- **mech-analytics** (activity read path, chains 10 / 100 / 137 / 8453):
  - API base URL is built in, not an env var: `MECH_ANALYTICS_URL` in `common-util/mechAnalytics/config.ts` (`https://mech-analytics-api.autonolas.tech`). If the endpoint moves, change the constant.
  - `NEXT_PUBLIC_USE_MECH_ANALYTICS_ROWS` — the only switch. Default ON when unset; set to exactly `"false"` to fall back to the subgraph reader.
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
| `/api/services` | Fetch services from marketplace subgraph (per chain). Requester counters can source from mech-analytics under the flag (see below). |
| `/api/service-activity` | Fetch mech request/delivery activity. Reads from mech-analytics under the flag on chains 10 / 100 / 137 / 8453; falls through to the marketplace subgraph otherwise. |
| `/api/erc8004/[network]/ai-agents/[serviceId]` | ERC8004 registration metadata |
| `/api/erc8004/[network]/ai-agents/[serviceId]/agent-card.json` | A2A agent card |
| `/api/erc8004/[network]/ai-agents/[serviceId]/mcp.json` | MCP server descriptor |

## Structure

- `pages/` – Next.js routes (dynamic `[network]` param).
- `components/` – Main UI: `ListServices/`, `ListAgents/`, `ListComponents/`, `Login/`.
- `common-util/` – Shared utilities, hooks, contract ABIs, GraphQL queries, IPFS helpers.
- `store/` – Redux slices (`setup.ts` for wallet state, `service.ts` for agent instances).
- `types/` – TypeScript type definitions.

## Server rendering (read this before touching Layout)

Until recently **every page in this app served 38 characters of readable text** — the `<title>`
and nothing else, including pages that already had `getServerSideProps`. The cause was one line
in `components/Layout/index.jsx`: the page body was gated behind `chainId`, which lives in Redux
and is only set from an effect in `useHandleRoute`. On the server, and on the first client
render, it is always `null`, so `children` rendered as `null`.

The gate now also accepts a chain id derived from the route
(`getChainIdFromPath` in `common-util/functions`). `useHandleRoute` dispatches that same value
once mounted, so the server render, the first client render and Redux all agree.

- **Do not re-gate the body on a value that only exists client-side.** That is the bug this
  fixed, and it is invisible in the browser — the page looks fine, but crawlers and AI
  assistants get nothing.
- Solana still falls through to the `isSvm` branch. Its listings come from a different source,
  so nothing is pre-rendered for it.
- Every page's main component is still `dynamic(..., { ssr: false })`. Opening the gate does not
  make them render on the server; it only allows content that *can* render to get through.

## Listing pages (`/[network]/ai-agents`, `/components`, `/agent-blueprints`)

Each pre-renders its first page of results with ISR (`getStaticProps`, 5-minute revalidate,
`fallback: 'blocking'`). The interactive tables are untouched; the data is rendered a second time
inside a `hidden` block by `components/ListingSummary`, so crawlers read it and nothing changes on
screen.

- **`ai-agents` pre-renders every EVM network; `components` and `agent-blueprints` pre-render
  Ethereum alone** (`l1ListingStaticPaths` + `l1Only: true`). Those two are L1-only registries and
  `useHandleRoute` redirects any other network on those routes to `/[network]/ai-agents` — so
  pre-rendering all eight published seven crawlable copies of one list at URLs a reader never
  stays on. The other networks still render and redirect as before; they just carry no listing.

- `hidden`, not `.sr-only` — the visible table renders the same rows after hydration, so
  exposing both to assistive tech would announce every entry twice.
- `common-util/functions/fetchListings.ts` mirrors the queries in each list's hooks. **If those
  queries change, change these too** — nothing enforces that link.
- **The summary deliberately makes no claim about which network the rows belong to.** The
  listings read one global subgraph (`NEXT_PUBLIC_AUTONOLAS_SUB_GRAPH_URL`), so every
  `/[network]/...` page shows the *same* rows. Saying "on Base" would be false on seven networks
  out of eight. (That per-network duplication looks like a pre-existing bug — per-network
  clients exist in `common-util/graphql` but the listings do not use them.)
- Guarded by `yarn check:served-text marketplace`, which fails if a listing page ships without
  its summary block.

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

#### Counter sources (off-chain requests)

Mech requests are moving off-chain. Once they do, the subgraph stops creating per-request `Request` entities, and `Service.totalRequests` / `Service.totalDeliveries` **freeze** — they are only incremented by the on-chain `handleMarketplaceRequest` and the legacy `handleMarketplaceDelivery` handlers, never by `handleMarketplaceDeliveryWithSignatures`.

`common-util/graphql/services.ts` therefore reads the counters that are incremented on **both** paths, and merges them with the legacy `Service.*` totals via `Math.max` so services with only pre-switch history keep their role:

| Role side | Source | Notes |
|---|---|---|
| Demand | `Sender.totalLegacyRequests`, summed over the service's `latestMultisig` + `historicalMultisigs` | Do **not** add `totalMarketplaceRequests` on top — the on-chain handler bumps both at once, so the sum over-counts every on-chain request |
| Supply | `Mech.totalDeliveriesTransactions` | Incremented by delivered item count on the delivery mech by both handlers. `Mech.id` **is the service id**, so it joins directly on `serviceIds` (the address lives in `Mech.address`) |

This needs two round trips: the multisigs are only known once `services` returns. `getMarketplaceRole()` and the ERC8004 routes are unchanged — the `Service` type keeps its `totalRequests` / `totalDeliveries` shape, only the source changed.

Demand comes out at exact parity with the legacy counter; supply does **not**, which is what makes the `Math.max` load-bearing rather than defensive. `Mech` rows only exist for marketplace mechs created via `handleCreateMech`, so a legacy agent-mech service can report deliveries with no `Mech` entity at all — without the max it would lose the Supply role outright. Off-chain traffic only settles through marketplace mechs, so the new counter covers exactly the future traffic while the max preserves legacy history. (Sampled figures behind this are in the PR that introduced it, valory-xyz/autonolas-frontend-mono#441.)

Consequence: the merged `totalDeliveries` is `max()` of two different measures, so treat it as a **role/gate signal, not a displayable count**. Nothing renders it as a number today (it drives only the role tag and the ERC8004 `>= 1` gate); if that ever changes, revisit this.

Note `Service.mechs` resolves to `MechAgent` (legacy path, only has `totalTransactions`), which is a **different entity** from `Mech` — hence the separate top-level `meches` query.

#### mech-analytics read path (chains 10 / 100 / 137 / 8453)

The activity tab reads from mech-analytics behind `NEXT_PUBLIC_USE_MECH_ANALYTICS_ROWS`: default ON, set to exactly `"false"` to fall back to the subgraph path. The API base URL is built in (`MECH_ANALYTICS_URL` in `common-util/mechAnalytics/config.ts`).

Three fan-outs per request (all `sort_direction=desc` so page 1 is the newest rows):

| Fan-out | Filter | Semantic |
|---|---|---|
| Demand delivered | `?requester=<multisig>` on `/v1/data/scored-rows` | Requests this service's safes made and that landed a delivery |
| Demand pending / abandoned | `?requester=<multisig>` on `/v1/data/unscored-rows` | Requests the mech never delivered (mech-analytics gates admission on `requested_at > 24h` — freshly-fired in-flight requests won't appear for their first day) |
| Supply | `?delivery_mech=<mech address>` on `/v1/data/scored-rows` | Requests this mech actually delivered. Filters on `delivery_mech`, NOT `mech_address` (which is `priority_mech`), so priority-vs-delivery divergence resolves at the query layer |

The pending-tail gap (< 24h old, undelivered) is closed by unioning subgraph `Request` entities that have no delivery timestamp. Delivered subgraph rows are dropped from the union because mech-analytics covers those via `sort_direction=desc` and unioning them would bypass the `ipfsRetrievable` gate (subgraph rows don't set it).

Column semantics on mech-analytics rows (post alembic 017):

- `deliveredBy` comes from `delivery_mech` directly. No more subgraph-twin merge for this field.
- `feeUnit` / `feeRaw` / `finalFeeUSD` come from `payment_type` + `delivery_rate` via `mapPaymentToFee()`. `native` → NATIVE / raw wei, `usdc` → USDC / $X.XX (from micro-USDC), `nvm_subscription` → CREDITS. The legacy `Activity.payment` field is not set on mech-analytics rows: `formatPayment` prefers `feeUnit`-based rendering and only falls back to `payment` when no unit is set.
- `payment_type` has two null shapes that must be handled differently:
  - **Legitimate NULL (pre-013 historical tail)**: `mapPaymentToFee(null, rate)` returns `{null, null, null}`, and the twin-merge above falls back to the subgraph twin's `payment` / `feeUnit` / `feeRaw` so the Payment row still renders for these rows.
  - **Unrecognised `payment_type` string (schema drift)**: same null output for the fields, but the mapper emits a `console.warn` (once per unknown value) so ops can add a case. The twin fallback intentionally does NOT fire on this branch so a new payment type doesn't silently mislabel via whatever the twin happens to carry.
- `feeUSD` / `finalFeeUSD` for on-chain rows can be enriched from the subgraph twin (mech-analytics doesn't project USD) via the request-id merge.

Failure isolation: each shard's fetch has its own `.catch()` so one 5xx doesn't discard the sibling fetches. Failures set `degraded=true` on the response; the API layer shortens the CDN TTL to 60 s in that case so a transient blip doesn't get pinned in cache.

`hasMore` fires only when the descending scan hits `ACTIVITY_MAX_PAGES` (5 pages of 1000 rows). FE renders a "some older rows were truncated" hint. Not fired just because the response is non-empty.

Request-id canonicalisation: mech-analytics writes `0x` + 64 lowercase hex; the marketplace subgraph legacy path uses `BigInt.toHexString()` which trims leading zeros (~1 in 16 ids loses a nibble). `canonicalRequestId()` normalises both sides so the merge / dedup key agrees.

The `ipfsRetrievable` gate on `AddressLink` renders CIDs as text always, and wraps them in a gateway `<a href>` only when `ipfsRetrievable === true`. Off-chain rows (`source = 'mech_offchain'`) come back with `ipfsRetrievable = false` — the mech's local CIDv1 is stored end-to-end but not pinned to public IPFS, so the link would 404.

**Key files:**
- `common-util/graphql/index.ts` – `MARKETPLACE_SUBGRAPH_CLIENTS`, `MarketplaceSubgraphChainId`
- `common-util/graphql/service-activity.ts` – Subgraph activity queries (fallback + pending-tail source)
- `common-util/graphql/services.ts` – Service list queries + optional mech-analytics counter branch
- `common-util/mechAnalytics/client.ts` – Typed thin wrapper over `/v1/data/scored-rows` etc, with 30 s aborted-fetch + body-read
- `common-util/mechAnalytics/service-activity.ts` – Fan-out orchestrator with column-level projection
- `common-util/mechAnalytics/config.ts` – Flag / URL / supported-chain helpers
- `common-util/Details/ActivityDetails.tsx` – Activity detail modal (fee rendering)
- `common-util/types/index.ts` – `Activity`, `Request`, `Delivery`, `FeeUnit`, `ServiceActivity` types

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

- **A wallet (via RainbowKit's connect modal) is required** for core flows (registration, deployments, transactions). RainbowKit needs a WalletConnect Cloud projectId — `NEXT_PUBLIC_WALLET_PROJECT_ID`.
- Multi-chain: always consider which chain and which subgraph/registry URL a feature uses.
- Some code is still `.jsx`; follow existing patterns when editing those files.
- L1-only features (agents, components) must check `isL1Network()`.
- Marketplace activity features available on chains in `MARKETPLACE_SUPPORTED_CHAIN_IDS`.
- ERC8004 endpoints are server-side API routes; they fetch from registry subgraph + IPFS.

### SEO / Meta

- `components/Meta.tsx` renders per-page `<title>`/`<meta>` plus a `<link rel="canonical">` built from `pageUrl` (query-string-free) — pass clean `pageUrl` values (no `?legacy=`, `?activity=`, etc.) so query-param variants consolidate onto one canonical URL.
- Since list pages exist per network, their titles must include the network or the same list type on different chains is a duplicate title. Use `getNetworkDisplayName(network)` (`common-util/functions`) to map the route slug (e.g. `arbitrum-one`) to a display name (e.g. `Arbitrum One`); the AI Agents list/mint and `[network]` dashboard build titles like `AI Agents on Gnosis`.
