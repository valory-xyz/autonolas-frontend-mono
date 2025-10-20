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
  latest,
}: {
  chainId: number;
  serviceId: string;
  latest?: string;
}): Promise<ServiceActivityResponse> => {
  const params = new URLSearchParams({
    chainId: chainId.toString(),
    serviceId,
  });

  if (latest) {
    params.set('latest', latest);
  }

  const data = await fetch(`/api/service-activity?${params.toString()}`, {
    method: 'GET',
  });
  const json = await data.json();
  return json.services;
};
