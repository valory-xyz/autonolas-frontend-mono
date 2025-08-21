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
