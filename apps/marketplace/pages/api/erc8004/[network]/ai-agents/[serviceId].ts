import type { NextApiRequest, NextApiResponse } from 'next';

import { IDENTITY_REGISTRY_UPGRADEABLE } from 'libs/util-contracts/src/lib/abiAndAddresses/identityRegistryUpgradeable';
import { RPC_URLS } from 'libs/util-constants/src';

import { ADDRESSES } from 'common-util/Contracts/addresses';
import { getIpfsResponse } from 'common-util/functions/ipfs';
import { generateName } from 'common-util/functions/agentName';
import { MARKETPLACE_SUBGRAPH_CLIENTS } from 'common-util/graphql';
import { getServicesFromMarketplaceSubgraph } from 'common-util/graphql/services';

import { CACHE_DURATION, GATEWAY_URL, MARKETPLACE_SUPPORTED_CHAIN_IDS } from 'util/constants';
import { zeroAddress } from 'viem';

import {
  getChainIdFromNetworkSlug,
  getSupportedNetworkNames,
  normalizeQueryParam,
  getServiceFromRegistrySafe,
  buildServiceRegistryContext,
  getAgentCardUrl,
  getMcpJsonUrl,
} from 'common-util/functions/erc8004Helpers';

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
    agentId: number;
    agentRegistry: string;
  }>;
  supportedTrust: string[];
};

const getImageUrl = (image: string | undefined) => {
  if (!image) return '';
  return image.replace('ipfs://', GATEWAY_URL);
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

    const unTypedChainId = getChainIdFromNetworkSlug(network);

    if (!unTypedChainId) {
      return res.status(400).json({
        error: `Invalid network: ${network}. Supported networks are: ${getSupportedNetworkNames()}`,
      });
    }

    const chainId = unTypedChainId as keyof typeof ADDRESSES;

    const rpcUrl = RPC_URLS[chainId];
    if (!rpcUrl) {
      return res.status(500).json({
        error: `No RPC URL configured for network: ${network}`,
      });
    }

    const registryCtx = buildServiceRegistryContext(chainId, rpcUrl);
    if (!registryCtx) {
      return res.status(500).json({
        error: `No contract addresses configured for network: ${network}`,
      });
    }

    const { serviceRegistryContract } = registryCtx;

    // Check if service exists
    const exists = await serviceRegistryContract.exists(serviceId);
    if (!exists) {
      return res.status(404).json({
        error: `Service ${serviceId} not found on network ${network}`,
      });
    }

    const serviceData = await serviceRegistryContract.getService(serviceId);
    const configHash = serviceData.configHash;

    const isMarketplaceChain = MARKETPLACE_SUPPORTED_CHAIN_IDS.includes(
      chainId as (typeof MARKETPLACE_SUPPORTED_CHAIN_IDS)[number],
    );

    const [metadata, serviceFromRegistry, servicesFromMarketplace] = await Promise.all([
      getIpfsResponse(configHash),
      getServiceFromRegistrySafe(chainId, serviceId),
      isMarketplaceChain
        ? getServicesFromMarketplaceSubgraph({
            chainId: chainId as keyof typeof MARKETPLACE_SUBGRAPH_CLIENTS,
            serviceIds: [serviceId],
          })
        : Promise.resolve(null),
    ]);
    const registrations: Erc8004Response['registrations'] = [];

    if (serviceFromRegistry?.erc8004Agent?.id) {
      const agentId = Number(serviceFromRegistry.erc8004Agent.id);
      if (!Number.isNaN(agentId)) {
        registrations.push({
          agentId,
          agentRegistry: `eip155:${chainId}:${IDENTITY_REGISTRY_UPGRADEABLE.addresses[chainId as keyof typeof IDENTITY_REGISTRY_UPGRADEABLE.addresses]}`,
        });
      }
    }

    const services = [
      {
        name: 'web',
        endpoint: `https://marketplace.olas.network/${network}/ai-agents/${serviceId}`,
      },
    ];

    const agentWallet = serviceFromRegistry?.erc8004Agent?.agentWallet;

    if (!!agentWallet && agentWallet !== zeroAddress) {
      services.push({
        name: 'agentWallet',
        endpoint: `eip155:${chainId}:${agentWallet}`,
      });
    }

    // Add A2A Agent Card and MCP entries for services with Supply role (totalDeliveries >= 1)
    const serviceFromMarketplace = servicesFromMarketplace?.[0];
    if (serviceFromMarketplace && serviceFromMarketplace.totalDeliveries >= 1) {
      services.push({
        name: 'A2A',
        endpoint: getAgentCardUrl(network, serviceId),
      });
      services.push({
        name: 'MCP',
        endpoint: getMcpJsonUrl(network, serviceId),
      });
    }

    const agentName = generateName(chainId, Number(serviceId));
    const nameWithSuffix = `${agentName} by Olas`;

    const response: Erc8004Response = {
      type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
      name: nameWithSuffix,
      description: metadata?.description ?? '',
      image: getImageUrl(metadata?.image),
      services,
      x402Support: false,
      active: true,
      registrations,
      supportedTrust: ['reputation'],
    };

    res.setHeader(
      'Cache-Control',
      `public, s-maxage=${CACHE_DURATION.SIX_HOURS}, stale-while-revalidate=${CACHE_DURATION.FIVE_MINUTES}`,
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching ERC-8004 token URI:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}
