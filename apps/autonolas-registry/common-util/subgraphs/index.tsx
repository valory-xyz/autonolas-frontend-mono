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
    body: JSON.stringify({ network, serviceIds }),
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
  const data = await fetch('/api/service-activity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ network, serviceId, limitForMM, limitForLegacy }),
  });
  const json = await data.json();
  return json.services;
};
