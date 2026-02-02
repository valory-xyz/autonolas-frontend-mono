import { ethers } from 'ethers';
import type { NextApiRequest, NextApiResponse } from 'next';

import { isL1Network } from 'libs/util-functions/src';
import { IDENTITY_REGISTRY_UPGRADEABLE } from 'libs/util-contracts/src/lib/abiAndAddresses/identityRegistryUpgradeable';

import { SERVICE_REGISTRY_CONTRACT, SERVICE_REGISTRY_L2 } from 'common-util/AbiAndAddresses';
import { ADDRESSES } from 'common-util/Contracts/addresses';
import { RPC_URLS } from 'libs/util-constants/src';
import { getIpfsResponse } from 'common-util/functions/ipfs';
import { EVM_SUPPORTED_CHAINS } from 'common-util/Login/config';
import { getServiceFromRegistry } from 'common-util/graphql/registry';
import { REGISTRY_SUBGRAPH_CLIENTS } from 'common-util/graphql';

import { CACHE_DURATION, GATEWAY_URL } from 'util/constants';

type Erc8004Response = {
  type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1';
  name: string;
  description: string;
  image: string;
  services: Array<{
    name: string;
    endpoint: string;
  }>;
  x402Support: boolean;
  active: boolean;
  registrations: Array<{
    agentId: string;
    agentRegistry: string;
  }>;
  supportedTrust: string[];
};

const getImageUrl = (image: string | undefined) => {
  if (!image) return '';
  return image.replace('ipfs://', GATEWAY_URL);
};

const getChainIdFromNetworkSlug = (network: string): number | null => {
  if (typeof network !== 'string') return null;
  const chain = EVM_SUPPORTED_CHAINS.find(
    (chain) => chain.networkName.toLowerCase() === network.toLowerCase(),
  );
  return chain?.id ?? null;
};

const getSupportedNetworkNames = (): string =>
  EVM_SUPPORTED_CHAINS.map((c) => c.networkName).join(', ');

const normalizeQueryParam = (param: NextApiRequest['query'][string]): string | undefined =>
  Array.isArray(param) ? param[0] : param;

const getServiceFromRegistrySafe = async (chainId: number, serviceId: string) => {
  if (chainId in REGISTRY_SUBGRAPH_CLIENTS) {
    try {
      return await getServiceFromRegistry({
        chainId: chainId as keyof typeof REGISTRY_SUBGRAPH_CLIENTS,
        id: serviceId,
      });
    } catch (error) {
      console.error(
        `Error fetching service ${serviceId} from registry on chain ${chainId}:`,
        error,
      );
    }
  }
  return null;
};

const getAgentWallet = async (
  chainId: number,
  agentId: string,
  rpcUrl: string,
): Promise<string | undefined> => {
  const identityRegistryAddress =
    IDENTITY_REGISTRY_UPGRADEABLE.addresses[
      chainId as keyof typeof IDENTITY_REGISTRY_UPGRADEABLE.addresses
    ];

  if (!identityRegistryAddress) return;

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const identityRegistryContract = new ethers.Contract(
      identityRegistryAddress,
      IDENTITY_REGISTRY_UPGRADEABLE.abi,
      provider,
    );

    const agentWallet = await identityRegistryContract.getAgentWallet(agentId);
    return agentWallet;
  } catch (error) {
    console.error(`Error fetching agent wallet for agent ${agentId} on chain ${chainId}:`, error);
    return;
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Erc8004Response | { error: string }>,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { network: networkParam, serviceId: serviceIdParam } = req.query;
    const network = normalizeQueryParam(networkParam);
    const serviceId = normalizeQueryParam(serviceIdParam);

    if (!network || !serviceId) {
      return res.status(400).json({
        error: 'Missing required parameters: network or serviceId',
      });
    }

    if (!/^\d+$/.test(serviceId)) {
      return res.status(400).json({
        error: 'Invalid serviceId: must be a valid serviceId',
      });
    }

    const chainId = getChainIdFromNetworkSlug(network);

    if (!chainId) {
      return res.status(400).json({
        error: `Invalid network: ${network}. Supported networks are: ${getSupportedNetworkNames()}`,
      });
    }

    const rpcUrl = RPC_URLS[chainId];
    if (!rpcUrl) {
      return res.status(500).json({
        error: `No RPC URL configured for network: ${network}`,
      });
    }

    const registryAddresses = ADDRESSES[chainId as keyof typeof ADDRESSES];
    if (!registryAddresses) {
      return res.status(500).json({
        error: `No contract addresses configured for network: ${network}`,
      });
    }

    const isL1 = isL1Network(chainId);
    const serviceRegistryAddress = isL1
      ? (registryAddresses as { serviceRegistry: string }).serviceRegistry
      : (registryAddresses as { serviceRegistryL2: string }).serviceRegistryL2;
    const serviceRegistryAbi = isL1 ? SERVICE_REGISTRY_CONTRACT.abi : SERVICE_REGISTRY_L2.abi;

    if (!serviceRegistryAddress) {
      return res.status(500).json({
        error: `No service registry address configured for network: ${network}`,
      });
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const serviceRegistryContract = new ethers.Contract(
      serviceRegistryAddress,
      serviceRegistryAbi,
      provider,
    );

    // Check if service exists
    const exists = await serviceRegistryContract.exists(serviceId);
    if (!exists) {
      return res.status(404).json({
        error: `Service ${serviceId} not found on network ${network}`,
      });
    }

    const serviceData = await serviceRegistryContract.getService(serviceId);
    const configHash = serviceData.configHash;

    const [metadata, serviceFromRegistry] = await Promise.all([
      getIpfsResponse(configHash),
      getServiceFromRegistrySafe(chainId, serviceId),
    ]);

    const registrations: Erc8004Response['registrations'] = [];
    let agentWallet: string | undefined;

    if (serviceFromRegistry?.erc8004AgentId) {
      registrations.push({
        agentId: serviceFromRegistry.erc8004AgentId,
        agentRegistry: `eip155:${chainId}:${IDENTITY_REGISTRY_UPGRADEABLE.addresses[chainId as keyof typeof IDENTITY_REGISTRY_UPGRADEABLE.addresses]}`,
      });

      const walletAddress = await getAgentWallet(
        chainId,
        serviceFromRegistry.erc8004AgentId,
        rpcUrl,
      );

      if (walletAddress) {
        agentWallet = `eip155:${chainId}:${walletAddress}`;
      }
    }

    const services = [
      {
        name: 'web',
        endpoint: `https://marketplace.olas.network/${network}/ai-agents/${serviceId}`,
      },
    ];

    if (agentWallet) {
      services.push({
        name: 'agentWallet',
        endpoint: agentWallet,
      });
    }

    const response: Erc8004Response = {
      type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
      name: metadata?.name ?? '',
      description: metadata?.description ?? '',
      image: getImageUrl(metadata?.image),
      services,
      x402Support: false,
      active: true,
      registrations,
      supportedTrust: ['reputation'],
    };

    res.setHeader('Cache-Control', `public, s-maxage=${CACHE_DURATION.FIVE_MINUTES}`);

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching ERC-8004 token URI:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}
