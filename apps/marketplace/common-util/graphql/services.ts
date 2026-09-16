import { Service } from 'common-util/types';
import { shouldUseMechAnalytics } from 'common-util/mechAnalytics/config';
import { fetchRequesterMetrics } from 'common-util/mechAnalytics/client';
import { mapWithConcurrency } from 'common-util/mechAnalytics/concurrency';
import { MARKETPLACE_SUBGRAPH_CLIENTS, type MarketplaceSubgraphChainId } from './index';
import { getSubgraphDialect, omitOnSquid, type SubgraphDialect } from './dialect';

// Max in-flight requester-metrics fetches. Higher = faster response,
// more pressure on mech-analytics + the serverless function's socket budget.
const REQUESTER_METRICS_CONCURRENCY = 8;

/**
 * `Service.totalRequests` / `totalDeliveries` freeze for off-chain traffic, so the
 * counts come from fields both handlers bump — `Sender.totalLegacyRequests` (demand)
 * and `Mech.totalDeliveriesTransactions` (supply) — merged with the legacy totals via
 * `Math.max`. Do NOT add `totalMarketplaceRequests`: the on-chain handler bumps it
 * alongside `totalLegacyRequests`, so the sum double-counts. Details in CLAUDE.md.
 */

type ServiceDetails = {
  id: string;
  totalRequests: string | number;
  totalDeliveries: string | number;
  latestMultisig: string | null;
  historicalMultisigs: string[] | null;
  metadata: {
    metadata?: string;
  }[];
  /** Legacy `MechAgent` rows. Not requested on the squid, which has no legacy entities. */
  mechs?: {
    id: string;
    address: string;
  }[];
};

type MechCounters = {
  id: string;
  address: string;
  totalDeliveriesTransactions: string | number;
};

type SenderCounters = {
  id: string;
  totalLegacyRequests: string | number;
};

const toQuotedList = (values: string[]) => values.map((value) => `"${value}"`).join(', ');

/**
 * `serviceIds` is an unbounded client-supplied param, and the-graph silently caps
 * a page at 1000 rows (its maximum `first`) rather than erroring — a truncated page
 * would undercount, so we page at that maximum and warn when a list reaches it.
 */
const PAGE_LIMIT = 1000;

/** `first` (The Graph) vs `limit` (OpenReader) — the only pagination delta the app uses. */
const pageArg = (dialect: SubgraphDialect) =>
  dialect === 'squid' ? `limit: ${PAGE_LIMIT}` : `first: ${PAGE_LIMIT}`;

/**
 * The squid has no legacy `MechAgent` entities, so `Service.mechs` does not exist
 * there; the top-level `meches` query (same name in both dialects) is the only mech source.
 */
export const getQueryForServiceDetails = ({
  serviceIds,
  dialect,
}: {
  serviceIds: string[];
  dialect: SubgraphDialect;
}) => `
    {
      services(
        ${pageArg(dialect)}
        where: {
          id_in: [${toQuotedList(serviceIds)}]
        }
      ) {
        id
        totalRequests
        totalDeliveries
        latestMultisig
        historicalMultisigs
        metadata {
          metadata
        }
        ${omitOnSquid(dialect, 'mechs { id address }')}
      }
      meches(
        ${pageArg(dialect)}
        where: {
          id_in: [${toQuotedList(serviceIds)}]
        }
      ) {
        id
        address
        totalDeliveriesTransactions
      }
    }
`;

export const getQueryForSenderCounters = ({
  multisigs,
  dialect,
}: {
  multisigs: string[];
  dialect: SubgraphDialect;
}) => `
    {
      senders(
        ${pageArg(dialect)}
        where: {
          id_in: [${toQuotedList(multisigs)}]
        }
      ) {
        id
        totalLegacyRequests
      }
    }
`;

type ServiceDetailsResponse = {
  services: ServiceDetails[];
  meches: MechCounters[];
};

type SenderCountersResponse = {
  senders: SenderCounters[];
};

/** Subgraph BigInt fields arrive as strings; a missing entity means zero. */
const toCount = (value: string | number | undefined | null) => {
  const count = Number(value);
  return Number.isFinite(count) ? count : 0;
};

/** Every address a service has requested from, deduped and lowercased for `id_in`. */
const getServiceMultisigs = (service: ServiceDetails) =>
  Array.from(
    new Set(
      [service.latestMultisig, ...(service.historicalMultisigs ?? [])]
        .filter((multisig): multisig is string => Boolean(multisig))
        .map((multisig) => multisig.toLowerCase()),
    ),
  );

// `service.mechs` derives from `MechAgent`, which is only ever populated
// by the legacy AgentFactory / AgentRegistry mappings. The marketplace
// handler creates a top-level `Mech` entity keyed by `serviceId.toString()`
// with no reverse derivedFrom back onto Service. So a service whose mech
// was created via MechMarketplace has an EMPTY `service.mechs`, and the
// Supply fan-out below iterates zero mech addresses. Query both entities
// and union the addresses so both eras resolve.
//
// The id is a GraphQL variable, never interpolated: `service(id: ID!)` /
// `mech(id: ID!)` on The Graph, `serviceById(id: String!)` / `mechById` on
// the squid.
export const getQueryForServiceEndpoints = (dialect: SubgraphDialect) =>
  dialect === 'squid'
    ? `
    query ServiceEndpoints($id: String!) {
      serviceById(id: $id) {
        id
        latestMultisig
        historicalMultisigs
      }
      mechById(id: $id) {
        address
      }
    }
  `
    : `
    query ServiceEndpoints($id: ID!) {
      service(id: $id) {
        id
        latestMultisig
        historicalMultisigs
        mechs {
          id
          address
        }
      }
      mech(id: $id) {
        address
      }
    }
  `;

export const getServiceEndpointsFromMarketplaceSubgraph = async ({
  chainId,
  serviceId,
}: {
  chainId: MarketplaceSubgraphChainId;
  serviceId: string;
}): Promise<{ multisigs: string[]; mechAddresses: string[] }> => {
  const client = MARKETPLACE_SUBGRAPH_CLIENTS[chainId];
  const dialect = getSubgraphDialect(chainId);
  const response = await client.request<{
    service?: ServiceDetails | null;
    serviceById?: ServiceDetails | null;
    mech?: { address: string } | null;
    mechById?: { address: string } | null;
  }>(getQueryForServiceEndpoints(dialect), { id: serviceId });
  const service = dialect === 'squid' ? response.serviceById : response.service;
  const mech = dialect === 'squid' ? response.mechById : response.mech;
  if (!service) return { multisigs: [], mechAddresses: [] };
  const legacy = (service.mechs ?? []).map((m) => m.address);
  const marketplace = mech?.address ? [mech.address] : [];
  return {
    multisigs: getServiceMultisigs(service),
    mechAddresses: Array.from(
      new Set([...legacy, ...marketplace].map((address) => address.toLowerCase())),
    ),
  };
};

export const getServicesFromMarketplaceSubgraph = async ({
  chainId,
  serviceIds,
}: {
  chainId: MarketplaceSubgraphChainId;
  serviceIds: string[];
}): Promise<Service[]> => {
  const client = MARKETPLACE_SUBGRAPH_CLIENTS[chainId];
  const dialect = getSubgraphDialect(chainId);

  const query = getQueryForServiceDetails({ serviceIds, dialect });
  const response = await client.request<ServiceDetailsResponse>(query);
  // `meches` is the only mech source on the squid; a renamed / missing field
  // would silently drop every service's Supply role, so make drift visible.
  if (response.meches == null) {
    console.warn(
      `[services] no \`meches\` field in the chain ${chainId} response; ` +
        'mech addresses and delivery counts will be empty',
    );
  }
  const mechRows = response.meches ?? [];

  const deliveriesByServiceId = new Map(
    mechRows.map((mech) => [mech.id, toCount(mech.totalDeliveriesTransactions)]),
  );

  // The multisigs are only known once the services come back, so the sender
  // counters need a second round trip.
  const multisigs = Array.from(
    new Set((response.services ?? []).flatMap((service) => getServiceMultisigs(service))),
  );

  const requestsByMultisig = new Map<string, number>();
  if (multisigs.length > 0) {
    if (shouldUseMechAnalytics(chainId)) {
      // Bounded fan-out: unlike the subgraph path's single `senders`
      // query, mech-analytics is one HTTP request per multisig. A
      // client-driven `?serviceIds=…` could union hundreds of multisigs,
      // so we chunk to REQUESTER_METRICS_CONCURRENCY in flight instead
      // of firing every request at once. Per-multisig failure falls
      // back to the subgraph legacy total via Math.max below.
      const metricsPerMultisig = await mapWithConcurrency(
        multisigs,
        REQUESTER_METRICS_CONCURRENCY,
        (multisig) =>
          fetchRequesterMetrics(chainId, multisig).catch((error: unknown) => {
            console.warn(
              `[services] mech-analytics requester metrics failed for ${multisig} on ` +
                `chain ${chainId}; falling back to subgraph totals: ${String(error)}`,
            );
            return null;
          }),
      );
      multisigs.forEach((multisig, i) => {
        // Narrow shape guard rather than blind property access — the
        // client cast is unchecked, so a 200 with a drifted response
        // (renamed / missing windows) would otherwise throw here,
        // outside the fetch's try/catch, and 500 the whole route.
        const n = metricsPerMultisig[i]?.windows?.all?.n_mech_requests;
        if (typeof n === 'number') {
          requestsByMultisig.set(multisig.toLowerCase(), n);
        }
      });
    } else {
      // `services` and `meches` are bounded by `serviceIds`, but `multisigs` is the
      // union of every service's multisig history, so it can outgrow PAGE_LIMIT on
      // its own. The page would then truncate silently and `Math.max` would mask the
      // under-count with the legacy total — warn so it is at least detectable.
      if (multisigs.length >= PAGE_LIMIT) {
        console.warn(
          `[services] ${multisigs.length} multisigs >= page limit ${PAGE_LIMIT}; ` +
            'sender counters may be truncated and demand-side counts under-reported',
        );
      }

      const senderResponse = await client.request<SenderCountersResponse>(
        getQueryForSenderCounters({ multisigs, dialect }),
      );
      for (const sender of senderResponse.senders ?? []) {
        requestsByMultisig.set(sender.id.toLowerCase(), toCount(sender.totalLegacyRequests));
      }
    }
  }

  // Marketplace-era mech address is keyed by ``serviceId`` on the
  // top-level ``Mech`` entity (queried above as ``meches``). Legacy
  // rows come from ``service.mechs`` (MechAgent). Union both so
  // ERC8004 consumers (agent-card.json, mcp.json) that gate on a
  // ``mechAddress`` truthy check see the address for marketplace-era
  // services too. Same union as
  // ``getServiceEndpointsFromMarketplaceSubgraph`` — a service
  // whose mech was created via MechMarketplace has an empty
  // ``service.mechs`` otherwise.
  const marketplaceMechByServiceId = new Map(mechRows.map((mech) => [mech.id, mech.address]));

  return (response.services ?? []).map((service) => {
    const requestsFromSenders = getServiceMultisigs(service).reduce(
      (total, multisig) => total + (requestsByMultisig.get(multisig) ?? 0),
      0,
    );

    const legacyMechAddresses = (service.mechs ?? []).map((mech) => mech.address);
    const marketplaceMechAddress = marketplaceMechByServiceId.get(service.id);
    const mechAddresses = Array.from(
      new Set(
        [...legacyMechAddresses, marketplaceMechAddress]
          .filter((address): address is string => Boolean(address))
          .map((address) => address.toLowerCase()),
      ),
    );

    return {
      id: service.id,
      totalRequests: Math.max(requestsFromSenders, toCount(service.totalRequests)),
      totalDeliveries: Math.max(
        deliveriesByServiceId.get(service.id) ?? 0,
        toCount(service.totalDeliveries),
      ),
      metadata: service.metadata?.[0]?.metadata || '',
      mechAddresses,
    };
  });
};
