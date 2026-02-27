import { Service } from 'common-util/types';
import { MARKETPLACE_SUBGRAPH_CLIENTS } from './index';

type ServiceDetails = {
  id: string;
  totalRequests: number;
  totalDeliveries: number;
  metadata: {
    metadata?: string;
  }[];
  mechs: {
    id: string;
    address: string;
  }[];
};

export const getQueryForServiceDetails = ({ serviceIds }: { serviceIds: string[] }) => `
    {
      services(
        where: {
          id_in: [${serviceIds.map((id) => `"${id}"`).join(', ')}]
        }
      ) {
        id
        totalRequests
        totalDeliveries
        metadata {
          metadata
        }
        mechs {
          id
          address
        }
      }
    }
`;

type GraphQLResponse<T> = {
  services: T[];
};

export const getServicesFromMarketplaceSubgraph = async ({
  chainId,
  serviceIds,
}: {
  chainId: keyof typeof MARKETPLACE_SUBGRAPH_CLIENTS;
  serviceIds: string[];
}): Promise<Service[]> => {
  const client = MARKETPLACE_SUBGRAPH_CLIENTS[chainId];

  const query = getQueryForServiceDetails({ serviceIds });
  const response = await client.request<GraphQLResponse<ServiceDetails>>(query);
  const services = response.services.map((service) => ({
    ...service,
    metadata: service.metadata?.[0]?.metadata || '',
    mechAddresses: (service.mechs ?? []).map((mech) => mech.address),
  }));
  return services;
};
