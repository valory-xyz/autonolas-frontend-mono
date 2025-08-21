import { ServiceDetails } from 'common-util/apiRoute/services';

export const getServicesDataFromSubgraph = async ({
  network,
  serviceIds,
}: {
  network: 'gnosis' | 'base';
  serviceIds: number[];
}) => {
  const serviceIdsParam = serviceIds.map(String).join(',');
  const data = await fetch(`/api/services?network=${network}&serviceIds=${serviceIdsParam}`, {
    method: 'GET',
  });
  const json = await data.json();
  return json.services;
};

export const getServiceActivityDataFromSubgraph = async ({
  network,
  serviceId,
  limitForMM = 1000,
  limitForLegacy = 1000,
}: {
  network: 'gnosis' | 'base';
  serviceId: string;
  limitForMM?: number;
  limitForLegacy?: number;
}) => {
  const data = await fetch(
    `/api/service-activity?network=${network}&serviceId=${serviceId}&limitForMM=${limitForMM}&limitForLegacy=${limitForLegacy}`,
    {
      method: 'GET',
    },
  );
  const json = await data.json();
  return json.services;
};

const MAX_ACTIVITY_LIMIT = 1000;

export const getLimitsForSubgraphs = (serviceData: ServiceDetails[number]) => {
  const {
    totalRequestsFromMM,
    totalRequestsFromLegacy,
    totalDeliveriesFromMM,
    totalDeliveriesFromLegacy,
  } = serviceData;
  const limitForMM = Math.min(
    Math.max(totalRequestsFromMM, totalDeliveriesFromMM),
    MAX_ACTIVITY_LIMIT,
  );
  const limitForLegacy = Math.min(
    Math.max(totalRequestsFromLegacy, totalDeliveriesFromLegacy),
    MAX_ACTIVITY_LIMIT,
  );
  return { limitForMM, limitForLegacy };
};
