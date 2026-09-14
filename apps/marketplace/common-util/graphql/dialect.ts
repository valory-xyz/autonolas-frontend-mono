/**
 * Which GraphQL dialect a chain's indexer speaks.
 *
 * Every chain but Robinhood is served by a graph-node subgraph (The Graph
 * dialect). Robinhood (4663) is served by SQD squids, whose OpenReader
 * dialect differs in the handful of ways the query builders in this folder
 * branch on:
 *
 * | The Graph                                   | OpenReader (squid)                      |
 * |---------------------------------------------|-----------------------------------------|
 * | `service(id: "1")`                          | `serviceById(id: "1")`                  |
 * | `services(first: 10, skip: 20)`             | `services(limit: 10, offset: 20)`       |
 * | `where: { service_: { id: "1" } }`          | `where: { service: { id_eq: "1" } }`    |
 * | `orderBy: blockTimestamp, orderDirection: desc` | `orderBy: blockTimestamp_DESC`      |
 *
 * Plural query names are inflected the same way in both (`meches`, `delivers`).
 *
 * Field names on the entities the app reads are the same in both. The
 * squid has no legacy (pre-marketplace) entities, so `Service.mechs`,
 * `Request.mechRequest` and `Deliver.mechDelivery` do not exist there —
 * the squid-side queries simply do not ask for them.
 *
 * Reference: squids/marketplace/MIGRATION.md in valory-xyz/autonolas-subgraph.
 */
export type SubgraphDialect = 'graph' | 'squid';

export const SQUID_CHAIN_IDS: ReadonlyArray<number> = [4663];

export const getSubgraphDialect = (chainId: number): SubgraphDialect =>
  SQUID_CHAIN_IDS.includes(chainId) ? 'squid' : 'graph';
