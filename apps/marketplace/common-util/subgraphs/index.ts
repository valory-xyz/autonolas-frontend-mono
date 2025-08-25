import { mergeServiceActivity } from 'common-util/graphql/service-activity';
import { mergeServicesDetails } from 'common-util/graphql/services';
import type { MarketplaceSupportedNetwork } from 'common-util/types';

type ServiceDetailsResponse = ReturnType<typeof mergeServicesDetails>;

export const getServicesFromSubgraph = async ({
  network,
  serviceIds,
}: {
  network: MarketplaceSupportedNetwork;
  serviceIds: number[];
}): Promise<ServiceDetailsResponse> => {
  const serviceIdsParam = serviceIds.map(String).join(',');
  const data = await fetch(`/api/services?network=${network}&serviceIds=${serviceIdsParam}`, {
    method: 'GET',
  });
  const json = await data.json();
  return json.services;
};

type ServiceActivityResponse = ReturnType<typeof mergeServiceActivity>;

export const getServiceActivityFromSubgraph = async ({
  network,
  serviceId,
}: {
  network: MarketplaceSupportedNetwork;
  serviceId: string;
}): Promise<ServiceActivityResponse> => {
  const data = await fetch(`/api/service-activity?network=${network}&serviceId=${serviceId}`, {
    method: 'GET',
  });
  const json = await data.json();
  return json.services;
};
