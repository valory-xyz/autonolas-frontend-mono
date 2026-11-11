/** Marketplace and registry migrate independently, so each selects its own dialect. */
import type { MarketplaceSubgraphChainId, RegistrySubgraphChainId } from './index';

export type SubgraphDialect = 'graph' | 'squid';

export const MARKETPLACE_SQUID_CHAIN_IDS = [137, 8453, 4663] as const;
export const REGISTRY_SQUID_CHAIN_IDS = [4663] as const;

export const getMarketplaceDialect = (chainId: MarketplaceSubgraphChainId): SubgraphDialect =>
  (MARKETPLACE_SQUID_CHAIN_IDS as readonly number[]).includes(chainId) ? 'squid' : 'graph';

export const getRegistryDialect = (chainId: RegistrySubgraphChainId): SubgraphDialect =>
  (REGISTRY_SQUID_CHAIN_IDS as readonly number[]).includes(chainId) ? 'squid' : 'graph';

/** A selection that only the graph-node subgraphs have (legacy pre-marketplace entities). */
export const omitOnSquid = (dialect: SubgraphDialect, fragment: string) =>
  dialect === 'squid' ? '' : fragment;
