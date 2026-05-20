import { readContract } from '@wagmi/core';
import { Address } from 'viem';

import { serviceRegistryParams } from 'common-util/Contracts/params';
import { filterByOwner } from 'common-util/ContractUtils/myList';
import { getTokenDetailsRequest } from 'common-util/Details/utils';
import { getChainId, isMarketplaceSupportedNetwork } from 'common-util/functions';
import { getIpfsResponse } from 'common-util/functions/ipfs';
import { normalizeMetadataUrl } from 'common-util/functions/tokenUri';
import { convertStringToArray } from 'common-util/List/ListCommon';
import { wagmiConfig } from 'common-util/Login/config';
import { getServicesFromSubgraph } from 'common-util/subgraphs';

import {
  DEFAULT_SERVICE_CREATION_ETH_TOKEN,
  DEFAULT_SERVICE_CREATION_ETH_TOKEN_ZEROS,
  SERVICE_ROLE,
  TOTAL_VIEW_COUNT,
} from 'util/constants';

type Service = {
  id: string;
  configHash: string;
  description?: string;
  name?: string;
  metadata?: string;
  totalRequests?: number;
  totalDeliveries?: number;
  owner?: string;
  role?: string;
};

const requireChainId = (): number => {
  const chainId = getChainId();
  if (chainId instanceof Error) throw chainId;
  if (chainId === undefined || chainId === null) throw new Error('Cannot determine chain ID');
  return chainId as number;
};

// --------- HELPER METHODS ---------
export const getServiceOwner = async (id: string) => {
  const chainId = requireChainId();
  return readContract(wagmiConfig, {
    ...serviceRegistryParams(chainId),
    functionName: 'ownerOf',
    args: [BigInt(id)],
  }) as Promise<Address>;
};

// --------- utils ---------
export const getServiceDetails = async (id: string) => {
  const chainId = requireChainId();
  const [response, owner] = await Promise.all([
    readContract(wagmiConfig, {
      ...serviceRegistryParams(chainId),
      functionName: 'getService',
      args: [BigInt(id)],
    }) as Promise<{ configHash: string; [key: string]: unknown }>,
    getServiceOwner(id),
  ]);
  return { ...response, owner };
};

export const getTotalForMyServices = async (account: string) => {
  const chainId = requireChainId();
  return readContract(wagmiConfig, {
    ...serviceRegistryParams(chainId),
    functionName: 'balanceOf',
    args: [account as Address],
  });
};

/** Returns the total supply of services on the active chain. */
export const getTotalForAllServices = async () => {
  const chainId = requireChainId();
  const total = await readContract(wagmiConfig, {
    ...serviceRegistryParams(chainId),
    functionName: 'totalSupply',
  });
  return total;
};

export const extractConfigDetailsForServices = async (
  services: { id: string; configHash: string }[],
) => {
  const serviceWithMetadata = await Promise.all(
    services.map(async (service) => {
      const metadata = await getIpfsResponse(service.configHash);
      const { description, name, image } = metadata || {};
      return { ...service, description, name, image };
    }),
  );
  return serviceWithMetadata;
};

export const getMarketplaceRole = (service: Service) => {
  const { totalRequests, totalDeliveries } = service;
  const chainId = getChainId();

  if (!isMarketplaceSupportedNetwork(Number(chainId))) {
    return SERVICE_ROLE.REGISTERED;
  }

  switch (true) {
    case totalRequests! > 0 && totalDeliveries! > 0:
      return SERVICE_ROLE.DEMAND_AND_SUPPLY;
    case totalRequests! > 0:
      return SERVICE_ROLE.DEMAND;
    case totalDeliveries! > 0:
      return SERVICE_ROLE.SUPPLY;
    default:
      return SERVICE_ROLE.REGISTERED;
  }
};

export const getServices = async (
  total: number,
  nextPage: number,
  fetchAll = false,
): Promise<Service[]> => {
  const chainId = requireChainId();

  const first = fetchAll ? 1 : (nextPage - 1) * TOTAL_VIEW_COUNT + 1;
  const last = fetchAll ? total : Math.min(nextPage * TOTAL_VIEW_COUNT, total);

  const existsPromises = [];
  for (let i = first; i <= last; i += 1) {
    existsPromises.push(
      readContract(wagmiConfig, {
        ...serviceRegistryParams(chainId),
        functionName: 'exists',
        args: [BigInt(i)],
      }),
    );
  }
  existsPromises.reverse();

  const existsResult = await Promise.allSettled(existsPromises);
  // filter services which don't exists (deleted or destroyed)
  const validTokenIds: string[] = [];

  existsResult.forEach((item, index) => {
    const serviceId = `${total - (index + first - 1)}`;
    if (item.status === 'fulfilled' && !!item.value) {
      validTokenIds.push(serviceId);
    }
  });

  // list of promises of valid service
  const results = await Promise.all(
    validTokenIds.map(async (id) => {
      const service = await getServiceDetails(id);
      return { id, ...service };
    }),
  );

  let servicesWithMetadata = await extractConfigDetailsForServices(results);
  if (isMarketplaceSupportedNetwork(Number(chainId))) {
    const servicesDataFromSubgraph = await getServicesFromSubgraph({
      chainId: Number(chainId),
      serviceIds: validTokenIds.map(Number),
    });
    servicesWithMetadata = servicesWithMetadata.map((service) => {
      const serviceDataFromSubgraph = servicesDataFromSubgraph.find((s) => s.id === service.id);
      return { ...service, ...serviceDataFromSubgraph };
    });
  }

  servicesWithMetadata = servicesWithMetadata.map((service) => ({
    ...service,
    role: getMarketplaceRole(service as Service),
  }));

  return servicesWithMetadata.sort((a, b) => Number(b.id) - Number(a.id)) as Service[];
};

export const getFilteredServices = async (
  searchValue: string,
  account: string,
): Promise<Service[]> => {
  const total = await getTotalForAllServices();
  const totalNum = Number(total);
  const list = await getServices(totalNum, Math.round(totalNum / TOTAL_VIEW_COUNT + 1), true);

  return new Promise((resolve) => {
    const filteredList = filterByOwner(list, { searchValue, account });
    resolve(filteredList);
  });
};

// for services, hash is hardcoded in frontend
export const getServiceHash = (values: { hash: string }) => values.hash;

/**
 *
 * 2D array of agent params
 * eg.
 * agent_num_slots = 1, 2
 * bonds = 100, 200
 * @returns [[1, 100], [2, 200]]
 */
export const getAgentParams = (values: { agent_num_slots: string; bonds: string }) => {
  const agentNumSlots = convertStringToArray(values.agent_num_slots);
  const bonds = convertStringToArray(values.bonds);
  return bonds.map((bond, index) => [agentNumSlots[index], bond]);
};

export const getServiceHashes = async (id: string) => {
  const chainId = requireChainId();
  return readContract(wagmiConfig, {
    ...serviceRegistryParams(chainId),
    functionName: 'getPreviousHashes',
    args: [BigInt(id)],
  });
};

export const getTokenUri = async (id: string) => {
  const chainId = requireChainId();
  const response = (await readContract(wagmiConfig, {
    ...serviceRegistryParams(chainId),
    functionName: 'tokenURI',
    args: [BigInt(id)],
  })) as string;
  return normalizeMetadataUrl(response);
};

export const getTokenAddressRequest = async (id: string) => {
  const response = (await getTokenDetailsRequest(id)) as { token: string };
  return response.token === DEFAULT_SERVICE_CREATION_ETH_TOKEN_ZEROS
    ? DEFAULT_SERVICE_CREATION_ETH_TOKEN
    : response.token;
};
