import { ethers } from 'ethers';
import type { NextApiRequest } from 'next';

import { isL1Network } from 'libs/util-functions/src';

import { SERVICE_REGISTRY_CONTRACT, SERVICE_REGISTRY_L2 } from 'common-util/AbiAndAddresses';
import { ADDRESSES } from 'common-util/Contracts/addresses';
import { EVM_SUPPORTED_CHAINS } from 'common-util/Login/config';
import { getServiceFromRegistry } from 'common-util/graphql/registry';
import { REGISTRY_SUBGRAPH_CLIENTS, ERC8004_SUPPORTED_CHAINS } from 'common-util/graphql';

export const getChainIdFromNetworkSlug = (network: string): number | null => {
  if (typeof network !== 'string') return null;
  const chain = EVM_SUPPORTED_CHAINS.find(
    (c) => c.networkName.toLowerCase() === network.toLowerCase(),
  );
  return chain?.id ?? null;
};

export const getSupportedNetworkNames = (): string =>
  EVM_SUPPORTED_CHAINS.map((c) => c.networkName).join(', ');

export const normalizeQueryParam = (param: NextApiRequest['query'][string]): string | undefined =>
  Array.isArray(param) ? param[0] : param;

export const getServiceFromRegistrySafe = async (chainId: number, serviceId: string) => {
  if (chainId in REGISTRY_SUBGRAPH_CLIENTS) {
    try {
      const includeErc8004 = ERC8004_SUPPORTED_CHAINS.some(
        (erc8004ChainId) => erc8004ChainId === chainId,
      );
      return await getServiceFromRegistry({
        chainId: chainId as keyof typeof REGISTRY_SUBGRAPH_CLIENTS,
        id: serviceId,
        includeErc8004,
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

export type ServiceRegistryContext = {
  provider: ethers.JsonRpcProvider;
  serviceRegistryContract: ethers.Contract;
  serviceRegistryAddress: string;
};

export const buildServiceRegistryContext = (
  chainId: keyof typeof ADDRESSES,
  rpcUrl: string,
): ServiceRegistryContext | null => {
  const registryAddresses = ADDRESSES[chainId];
  if (!registryAddresses) return null;

  const isL1 = isL1Network(chainId);
  const serviceRegistryAddress = isL1
    ? (registryAddresses as { serviceRegistry: string }).serviceRegistry
    : (registryAddresses as { serviceRegistryL2: string }).serviceRegistryL2;

  if (!serviceRegistryAddress) return null;

  const serviceRegistryAbi = isL1 ? SERVICE_REGISTRY_CONTRACT.abi : SERVICE_REGISTRY_L2.abi;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const serviceRegistryContract = new ethers.Contract(
    serviceRegistryAddress,
    serviceRegistryAbi,
    provider,
  );

  return { provider, serviceRegistryContract, serviceRegistryAddress };
};

/**
 * Normalize a tool schema from IPFS metadata so that:
 * 1. `type: "text"` becomes `type: "string"`.
 * 2. If a nested `schema` wrapper exists, its properties are spread to the
 *    top level and the wrapper is removed. */
export const normalizeToolSchema = (raw: {
  type: string;
  description: string;
  schema?: Record<string, unknown>;
}): { type: string; description: string } => {
  const { schema, ...rest } = raw;
  const base = schema ? { ...rest, ...schema } : rest;
  return {
    ...base,
    type: base.type === 'text' ? 'string' : base.type,
  };
};

export const getAgentCardUrl = (network: string, serviceId: string): string =>
  `https://marketplace.olas.network/erc8004/${network}/ai-agents/${serviceId}/agent-card.json`;

export const getMcpJsonUrl = (network: string, serviceId: string): string =>
  `https://marketplace.olas.network/erc8004/${network}/ai-agents/${serviceId}/mcp.json`;
