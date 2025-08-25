import { Service } from 'common-util/types';
import { LEGACY_MECH_SUBGRAPH_CLIENT, MM_GRAPHQL_CLIENTS } from './index';

export const getQueryForServiceDetails = ({
  serviceIds,
  isLegacy = false,
}: {
  serviceIds: string[];
  isLegacy?: boolean;
}) => {
  return `
    {
      services(
        where: { 
          id_in: [${serviceIds.map((id) => `"${id}"`).join(', ')}]
        }
      ) {
        id
        totalRequests
        totalDeliveries
        ${
          !isLegacy
            ? `metadata {
            metadata 
        }`
            : ''
        }
      }
    }
  `;
};

type GraphQLResponse<T> = {
  services: T[];
};

export const getServicesFromMMSubgraph = async ({
  chainId,
  serviceIds,
}: {
  chainId: keyof typeof MM_GRAPHQL_CLIENTS;
  serviceIds: string[];
}): Promise<Service[]> => {
  const client = MM_GRAPHQL_CLIENTS[chainId];

  const query = getQueryForServiceDetails({ serviceIds });
  const response = await client.request<GraphQLResponse<Service>>(query);
  return response.services;
};

export const getServicesFromLegacyMechSubgraph = async ({
  serviceIds,
}: {
  serviceIds: string[];
}): Promise<Service[]> => {
  const query = getQueryForServiceDetails({ serviceIds, isLegacy: true });
  const response = await LEGACY_MECH_SUBGRAPH_CLIENT.request<GraphQLResponse<Service>>(query);
  return response.services;
};

export type ServiceDetails = ReturnType<typeof mergeServicesDetails>;

export const mergeServicesDetails = (
  servicesFromMM: Service[],
  servicesFromLegacy: Service[] = [],
) => {
  const uniqueServiceIds = new Set([
    ...servicesFromMM.map((service) => service.id),
    ...servicesFromLegacy.map((service) => service.id),
  ]);

  const mergedServicesData = Array.from(uniqueServiceIds).map((id) => {
    const serviceFromMM = servicesFromMM.find((service) => service.id === id);
    const serviceFromLegacy = servicesFromLegacy.find((service) => service.id === id);

    const {
      totalRequests: totalRequestsFromMM = 0,
      totalDeliveries: totalDeliveriesFromMM = 0,
      metadata,
    } = serviceFromMM || {};
    const {
      totalRequests: totalRequestsFromLegacy = 0,
      totalDeliveries: totalDeliveriesFromLegacy = 0,
    } = serviceFromLegacy || {};

    return {
      id,
      totalRequestsFromLegacy: Number(totalRequestsFromLegacy),
      totalDeliveriesFromLegacy: Number(totalDeliveriesFromLegacy),
      totalRequestsFromMM: Number(totalRequestsFromMM),
      totalDeliveriesFromMM: Number(totalDeliveriesFromMM),
      totalRequests: Number(totalRequestsFromMM) + Number(totalRequestsFromLegacy),
      totalDeliveries: Number(totalDeliveriesFromMM) + Number(totalDeliveriesFromLegacy),
      metadata: metadata?.metadata || '',
    };
  });

  return mergedServicesData;
};
