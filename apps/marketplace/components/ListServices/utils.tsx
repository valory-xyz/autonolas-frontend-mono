import {
  DEFAULT_SERVICE_CREATION_ETH_TOKEN,
  TOTAL_VIEW_COUNT,
  DEFAULT_SERVICE_CREATION_ETH_TOKEN_ZEROS,
  SERVICE_ROLE,
} from 'util/constants';
import { getServiceContract, getWeb3Details } from 'common-util/Contracts';
import { convertStringToArray } from 'common-util/List/ListCommon';
import { filterByOwner } from 'common-util/ContractUtils/myList';
import { getTokenDetailsRequest } from 'common-util/Details/utils';
import { getIpfsResponse } from 'common-util/functions/ipfs';
import { getServicesFromSubgraph } from 'common-util/subgraphs';
import { isMarketplaceSupportedNetwork } from 'common-util/functions';

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

// --------- HELPER METHODS ---------
export const getServiceOwner = async (id: string) => {
  const contract = getServiceContract();
  const response = await contract.methods.ownerOf(id).call();
  return response;
};

// --------- utils ---------
export const getServiceDetails = async (id: string) => {
  const contract = getServiceContract();
  const response = await contract.methods.getService(id).call();
  const owner = await getServiceOwner(id);
  return { ...response, owner };
};

export const getTotalForMyServices = async (account: string) => {
  const contract = getServiceContract();
  const total = await contract.methods.balanceOf(account).call();
  return total;
};

/**
 * Function to return all services
 */
export const getTotalForAllServices = async () => {
  const { web3 } = getWeb3Details();

  if (!web3) {
    throw new Error('Web3 provider not available');
  }

  const contract = getServiceContract();
  const total = await contract.methods.totalSupply().call();
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
  const { chainId } = getWeb3Details();

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
  const contract = getServiceContract();
  const { chainId } = getWeb3Details();

  const existsPromises = [];

  const first = fetchAll ? 1 : (nextPage - 1) * TOTAL_VIEW_COUNT + 1;
  const last = fetchAll ? total : Math.min(nextPage * TOTAL_VIEW_COUNT, total);

  for (let i = first; i <= last; i += 1) {
    const result = contract.methods.exists(`${i}`).call();
    existsPromises.push(result);
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
  const list = await getServices(total, Math.round(total / TOTAL_VIEW_COUNT + 1), true);

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
  const contract = getServiceContract();
  const information = await contract.methods.getPreviousHashes(id).call();
  return information;
};

export const getTokenUri = async (id: string) => {
  const contract = getServiceContract();
  const response = await contract.methods.tokenURI(id).call();
  return response;
};

export const getTokenAddressRequest = async (id: string) => {
  const response = await getTokenDetailsRequest(id);
  return response.token === DEFAULT_SERVICE_CREATION_ETH_TOKEN_ZEROS
    ? DEFAULT_SERVICE_CREATION_ETH_TOKEN
    : response.token;
};
