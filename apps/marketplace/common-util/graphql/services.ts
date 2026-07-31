import { Service } from 'common-util/types';
import { MARKETPLACE_SUBGRAPH_CLIENTS, type MarketplaceSubgraphChainId } from './index';

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
  mechs: {
    id: string;
    address: string;
  }[];
};

type MechCounters = {
  id: string;
  totalDeliveriesTransactions: string | number;
};

type SenderCounters = {
  id: string;
  totalLegacyRequests: string | number;
};

const toQuotedList = (values: string[]) => values.map((value) => `"${value}"`).join(', ');

export const getQueryForServiceDetails = ({ serviceIds }: { serviceIds: string[] }) => `
    {
      services(
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
        mechs {
          id
          address
        }
      }
      meches(
        where: {
          id_in: [${toQuotedList(serviceIds)}]
        }
      ) {
        id
        totalDeliveriesTransactions
      }
    }
`;

export const getQueryForSenderCounters = ({ multisigs }: { multisigs: string[] }) => `
    {
      senders(
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

export const getServicesFromMarketplaceSubgraph = async ({
  chainId,
  serviceIds,
}: {
  chainId: MarketplaceSubgraphChainId;
  serviceIds: string[];
}): Promise<Service[]> => {
  const client = MARKETPLACE_SUBGRAPH_CLIENTS[chainId];

  const query = getQueryForServiceDetails({ serviceIds });
  const response = await client.request<ServiceDetailsResponse>(query);

  const deliveriesByServiceId = new Map(
    (response.meches ?? []).map((mech) => [mech.id, toCount(mech.totalDeliveriesTransactions)]),
  );

  // The multisigs are only known once the services come back, so the sender
  // counters need a second round trip.
  const multisigs = Array.from(
    new Set((response.services ?? []).flatMap((service) => getServiceMultisigs(service))),
  );

  const requestsByMultisig = new Map<string, number>();
  if (multisigs.length > 0) {
    const senderResponse = await client.request<SenderCountersResponse>(
      getQueryForSenderCounters({ multisigs }),
    );
    for (const sender of senderResponse.senders ?? []) {
      requestsByMultisig.set(sender.id.toLowerCase(), toCount(sender.totalLegacyRequests));
    }
  }

  return (response.services ?? []).map((service) => {
    const requestsFromSenders = getServiceMultisigs(service).reduce(
      (total, multisig) => total + (requestsByMultisig.get(multisig) ?? 0),
      0,
    );

    return {
      id: service.id,
      totalRequests: Math.max(requestsFromSenders, toCount(service.totalRequests)),
      totalDeliveries: Math.max(
        deliveriesByServiceId.get(service.id) ?? 0,
        toCount(service.totalDeliveries),
      ),
      metadata: service.metadata?.[0]?.metadata || '',
      mechAddresses: (service.mechs ?? []).map((mech) => mech.address),
    };
  });
};
