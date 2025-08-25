import { mergeServiceActivity } from 'common-util/graphql/service-activity';
import { mergeServicesDetails } from 'common-util/graphql/services';

type ServiceDetailsResponse = ReturnType<typeof mergeServicesDetails>;

export const getServicesFromSubgraph = async ({
  chainId,
  serviceIds,
}: {
  chainId: number;
  serviceIds: number[];
}): Promise<ServiceDetailsResponse> => {
  const serviceIdsParam = serviceIds.map(String).join(',');
  const data = await fetch(`/api/services?chainId=${chainId}&serviceIds=${serviceIdsParam}`, {
    method: 'GET',
  });
  const json = await data.json();
  return json.services;
};

type ServiceActivityResponse = ReturnType<typeof mergeServiceActivity>;

export const getServiceActivityFromSubgraph = async ({
  chainId,
  serviceId,
}: {
  chainId: number;
  serviceId: string;
}): Promise<ServiceActivityResponse> => {
  const data = await fetch(`/api/service-activity?chainId=${chainId}&serviceId=${serviceId}`, {
    method: 'GET',
  });
  const json = await data.json();
  return json.services;
};
