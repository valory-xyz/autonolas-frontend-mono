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
 * | `services(first: 10)`                       | `services(limit: 10)`                   |
 * | `where: { service_: { id: "1" } }`          | `where: { service: { id_eq: "1" } }`    |
 * | `orderBy: blockTimestamp, orderDirection: desc` | `orderBy: blockTimestamp_DESC`      |
 *
 * Plural query names are inflected the same way in both (`meches`, `delivers`).
 *
 * Field names on the entities the app reads are the same in both. The
 * squid has no legacy (pre-marketplace) entities, so `Service.mechs`,
 * `Request.mechRequest` and `Deliver.mechDelivery` do not exist there —
 * the squid-side queries simply do not ask for them (see `omitOnSquid`).
 *
 * Reference: squids/marketplace/MIGRATION.md in valory-xyz/autonolas-subgraph.
 */
import type { MarketplaceSubgraphChainId, RegistrySubgraphChainId } from './index';

export type SubgraphDialect = 'graph' | 'squid';

export const SQUID_CHAIN_IDS = [4663] as const;

type SquidChainId = (typeof SQUID_CHAIN_IDS)[number];

const isSquidChain = (chainId: number): chainId is SquidChainId =>
  (SQUID_CHAIN_IDS as ReadonlyArray<number>).includes(chainId);

export const getSubgraphDialect = (
  chainId: MarketplaceSubgraphChainId | RegistrySubgraphChainId,
): SubgraphDialect => (isSquidChain(chainId) ? 'squid' : 'graph');

/** A selection that only the graph-node subgraphs have (legacy pre-marketplace entities). */
export const omitOnSquid = (dialect: SubgraphDialect, fragment: string) =>
  dialect === 'squid' ? '' : fragment;
