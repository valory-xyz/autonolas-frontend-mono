export const getServicesDataFromSubgraph = async ({
  network,
  serviceIds,
}: {
  network: 'gnosis' | 'base';
  serviceIds: number[];
}) => {
  const data = await fetch('/api/services', {
    method: 'POST',
    body: JSON.stringify({ network, serviceIds }),
  });
  const json = await data.json();
  return json.services;
};
