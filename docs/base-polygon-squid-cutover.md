# Base and Polygon indexers by app

Configure indexer variables in the deployment environment of the app that consumes them.
The root `.env.example` is shared across the monorepo; its entries are not all required by every app.
Examples contain placeholders only. Public Next.js variables are read at build time, so rebuild
and redeploy each affected app after configuring its variables.

| App | Indexer reads affected by this PR | Variables to configure for this PR | Existing squid configuration to retain |
| --- | --- | --- | --- |
| Marketplace | Marketplace activity and service registry on Base and Polygon | `NEXT_PUBLIC_MARKETPLACE_BASE_SQUID_URL`, `NEXT_PUBLIC_MARKETPLACE_POLYGON_SQUID_URL`, `NEXT_PUBLIC_REGISTRY_BASE_SQUID_URL`, `NEXT_PUBLIC_REGISTRY_POLYGON_SQUID_URL` | Robinhood keeps its existing configuration |
| Launch | Staking contracts on Polygon | `NEXT_PUBLIC_STAKING_POLYGON_SQUID_URL` | `NEXT_PUBLIC_STAKING_BASE_SQUID_URL` for Base staking |
| Operate | Staking contracts and latest checkpoints on Polygon | `NEXT_PUBLIC_STAKING_POLYGON_SQUID_URL` | `NEXT_PUBLIC_STAKING_BASE_SQUID_URL` for Base staking |
| Contribute | No indexer change in this PR | None | `NEXT_PUBLIC_STAKING_BASE_SQUID_URL` for Base staking |

Launch and Operate consume staking indexers; they do not need the Marketplace app's
marketplace or registry variables. The Marketplace app does not use staking indexers.
Contribute's Base staking reader was already migrated and has no Polygon staking reader.
The other apps have no indexer configuration change in this PR.

## Replaced variables

In the Marketplace deployment, replace:

- `NEXT_PUBLIC_BASE_MARKETPLACE_SUBGRAPH_URL` with `NEXT_PUBLIC_MARKETPLACE_BASE_SQUID_URL`.
- `NEXT_PUBLIC_POLYGON_MARKETPLACE_SUBGRAPH_URL` with `NEXT_PUBLIC_MARKETPLACE_POLYGON_SQUID_URL`.
- `NEXT_PUBLIC_BASE_REGISTRY_SUBGRAPH` with `NEXT_PUBLIC_REGISTRY_BASE_SQUID_URL`.
- `NEXT_PUBLIC_POLYGON_REGISTRY_SUBGRAPH` with `NEXT_PUBLIC_REGISTRY_POLYGON_SQUID_URL`.

In the Launch and Operate deployments, replace `NEXT_PUBLIC_POLYGON_STAKING_SUBGRAPH_URL`
with `NEXT_PUBLIC_STAKING_POLYGON_SQUID_URL`. Keep their existing Base staking squid variable.

These readers use the SQD OpenReader queries and response adapters. Other chains keep their
existing indexers. Staking calculations and latest-checkpoint selection remain unchanged.
