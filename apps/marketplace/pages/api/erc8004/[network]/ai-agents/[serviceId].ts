import { ethers } from 'ethers';
import type { NextApiRequest, NextApiResponse } from 'next';

import { isL1Network } from 'libs/util-functions/src';

import { SERVICE_REGISTRY_CONTRACT, SERVICE_REGISTRY_L2 } from 'common-util/AbiAndAddresses';
import { ADDRESSES } from 'common-util/Contracts/addresses';
import { RPC_URLS } from 'common-util/Contracts/rpc';
import { getIpfsResponse } from 'common-util/functions/ipfs';
import { EVM_SUPPORTED_CHAINS } from 'common-util/Login/config';

import { CACHE_DURATION } from 'util/constants';

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

const getChainIdFromNetworkSlug = (network: string): number | null => {
  if (typeof network !== 'string') return null;
  const chain = EVM_SUPPORTED_CHAINS.find(
    (chain) => chain.networkName.toLowerCase() === network.toLowerCase(),
  );
  return chain?.id ?? null;
};

const getSupportedNetworkNames = (): string =>
  EVM_SUPPORTED_CHAINS.map((c) => c.networkName).join(', ');

const normarlizeQueryParam = (param: NextApiRequest['query'][string]): string | undefined =>
  Array.isArray(param) ? param[0] : param;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Erc8004Response | { error: string }>,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { network: networkParam, serviceId: serviceIdParam } = req.query;
    const network = normarlizeQueryParam(networkParam);
    const serviceId = normarlizeQueryParam(serviceIdParam);

    if (!network || !serviceId) {
      return res.status(400).json({
        error: 'Missing required parameters: network and serviceId',
      });
    }

    if (Number.isNaN(Number(serviceId)) || Number(serviceId) <= 0) {
      return res.status(400).json({
        error: 'Invalid serviceId: must be a positive integer',
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
    const metadata = await getIpfsResponse(configHash);

    const response: Erc8004Response = {
      type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
      name: metadata?.name ?? '',
      description: metadata?.description ?? '',
      image: metadata?.image ?? '',
      services: [
        {
          name: 'web',
          endpoint: `https://marketplace.olas.network/${network}/ai-agents/${serviceId}`,
        },
      ],
      x402Support: false,
      active: true,
      registrations: [],
      supportedTrust: ['reputation'],
    };

    res.setHeader(
      'Cache-Control',
      `public, s-maxage=${CACHE_DURATION.ONE_HOUR}, stale-while-revalidate=${CACHE_DURATION.ONE_HOUR}`,
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching ERC-8004 token URI:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}
