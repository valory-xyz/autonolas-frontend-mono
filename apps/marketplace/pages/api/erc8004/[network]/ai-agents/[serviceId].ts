import type { NextApiRequest, NextApiResponse } from 'next';

import { RPC_URLS } from 'libs/util-constants/src';

import { ADDRESSES } from 'common-util/Contracts/addresses';
import { getIpfsResponse, getIpfsUrl } from 'common-util/functions/ipfs';
import { generateName } from 'common-util/functions/agentName';
import { isMarketplaceSupportedNetwork } from 'common-util/functions';
import type { MarketplaceSubgraphChainId } from 'common-util/graphql';
import { getServicesFromMarketplaceSubgraph } from 'common-util/graphql/services';

import { CACHE_DURATION, GATEWAY_URL } from 'util/constants';
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
import {
  type Erc8004Provider,
  type MechManifest,
  getBenchmarkUrl,
  getIdentityRegistryAddress,
  getOperatorUrl,
  isServiceDeployed,
  isValidOperatorDomain,
  parseAgentId,
  resolveProvider,
} from 'common-util/functions/erc8004Kya';

type Erc8004Response = {
  type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1';
  name: string;
  description: string;
  image: string;
  provider?: Erc8004Provider;
  services: Array<{
    name: string;
    endpoint: string;
    version?: string;
  }>;
  x402Support: boolean;
  active: boolean;
  registrations: Array<{
    agentId: number;
    agentRegistry: string;
  }>;
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

    const hasMarketplaceSubgraph = isMarketplaceSupportedNetwork(chainId);

    const [metadata, serviceFromRegistry, servicesFromMarketplace] = await Promise.all([
      getIpfsResponse(configHash),
      getServiceFromRegistrySafe(chainId, serviceId),
      hasMarketplaceSubgraph
        ? getServicesFromMarketplaceSubgraph({
            chainId: chainId as MarketplaceSubgraphChainId,
            serviceIds: [serviceId],
          })
        : Promise.resolve(null),
    ]);

    const serviceFromMarketplace = servicesFromMarketplace?.[0];
    const manifestHash = serviceFromMarketplace?.metadata || '';
    const manifest = manifestHash
      ? ((await getIpfsResponse(manifestHash)) as unknown as MechManifest | null)
      : null;

    const registrations: Erc8004Response['registrations'] = [];
    const agentId = parseAgentId(serviceFromRegistry?.erc8004Agent?.id);
    const identityRegistryAddress = getIdentityRegistryAddress(chainId);

    if (agentId !== null && identityRegistryAddress) {
      registrations.push({
        agentId,
        agentRegistry: `eip155:${chainId}:${identityRegistryAddress}`,
      });
    }

    const services: Erc8004Response['services'] = [
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
    if (serviceFromMarketplace && serviceFromMarketplace.totalDeliveries >= 1) {
      services.push({
        name: 'A2A',
        endpoint: getAgentCardUrl(network, serviceId),
        version: '1.0.0',
      });
      services.push({
        name: 'MCP',
        endpoint: getMcpJsonUrl(network, serviceId),
        version: '1.0.0',
      });
    }

    if (manifestHash) {
      services.push({ name: 'manifest', endpoint: getIpfsUrl(manifestHash) });
    }

    const benchmarkUrl = manifest ? getBenchmarkUrl(manifest) : null;
    if (benchmarkUrl) {
      services.push({ name: 'benchmark', endpoint: benchmarkUrl });
    }

    const operator = manifest?.operator;
    if (operator && isValidOperatorDomain(operator.domain)) {
      services.push({
        name: 'operator',
        endpoint: getOperatorUrl(operator.domain),
      });
    }

    const provider = await resolveProvider(operator, chainId, agentId);

    const name =
      manifest?.name?.trim() || metadata?.name?.trim() || generateName(chainId, Number(serviceId));

    const response: Erc8004Response = {
      type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
      name,
      description: metadata?.description ?? '',
      image: getImageUrl(metadata?.image),
      ...(provider && { provider }),
      services,
      x402Support: false,
      active: isServiceDeployed(serviceData.state),
      registrations,
    };

    res.setHeader(
      'Cache-Control',
      `public, s-maxage=${CACHE_DURATION.ONE_HOUR}, stale-while-revalidate=${CACHE_DURATION.FIVE_MINUTES}`,
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching ERC-8004 token URI:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}
