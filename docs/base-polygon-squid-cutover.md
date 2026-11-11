# Base and Polygon indexer cutover

Marketplace, service registry and staking use SQD OpenReader endpoints on Base and Polygon.
Set the following deployment variables before rebuilding; environment examples contain placeholders only:

- `NEXT_PUBLIC_MARKETPLACE_BASE_SQUID_URL`
- `NEXT_PUBLIC_MARKETPLACE_POLYGON_SQUID_URL`
- `NEXT_PUBLIC_REGISTRY_BASE_SQUID_URL`
- `NEXT_PUBLIC_REGISTRY_POLYGON_SQUID_URL`
- `NEXT_PUBLIC_STAKING_BASE_SQUID_URL`
- `NEXT_PUBLIC_STAKING_POLYGON_SQUID_URL`

Base registry and staking were already migrated in the website and KPIs app. Frontend-mono
also migrates Base registry in this PR. Polygon registry and staking are new in all three.
The replaced Base/Polygon registry and Polygon staking subgraph variables are no longer runtime sources.
Other chains keep their existing indexers. Existing reward, APR, ROI and epoch-history calculations
are preserved; queries and response adapters select the corresponding OpenReader dialect.

These public Next.js variables are read at build time. Configure them and rebuild/redeploy.
The KPIs generated Graph client no longer includes the Polygon registry source; Polygon DAA
history now uses the shared squid requester with pagination and freshness checks.
