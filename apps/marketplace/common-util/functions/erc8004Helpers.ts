import { ethers } from 'ethers';
import type { NextApiRequest } from 'next';

import { RPC_URLS } from 'libs/util-constants/src';
import { isL1Network } from 'libs/util-functions/src';

import { SERVICE_REGISTRY_CONTRACT, SERVICE_REGISTRY_L2 } from 'common-util/AbiAndAddresses';
import { ADDRESSES } from 'common-util/Contracts/addresses';
import { EVM_SUPPORTED_CHAINS } from 'common-util/Login/config';
import { getServiceFromRegistry } from 'common-util/graphql/registry';
import { REGISTRY_SUBGRAPH_CLIENTS, ERC8004_SUPPORTED_CHAINS } from 'common-util/graphql';
import {
  RPC_READ_TIMEOUT_MS,
  asText,
  singleAttemptProvider,
  withTimeout,
} from 'common-util/functions/erc8004Kya';
import type { ToolInputOutput } from 'common-util/functions/erc8004Kya';
import { getIpfsResponse } from 'common-util/functions/ipfs';

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
  provider: ethers.JsonRpcProvider = new ethers.JsonRpcProvider(rpcUrl),
): ServiceRegistryContext | null => {
  const registryAddresses = ADDRESSES[chainId];
  if (!registryAddresses) return null;

  const isL1 = isL1Network(chainId);
  const serviceRegistryAddress = isL1
    ? (registryAddresses as { serviceRegistry: string }).serviceRegistry
    : (registryAddresses as { serviceRegistryL2: string }).serviceRegistryL2;

  if (!serviceRegistryAddress) return null;

  const serviceRegistryAbi = isL1 ? SERVICE_REGISTRY_CONTRACT.abi : SERVICE_REGISTRY_L2.abi;
  const serviceRegistryContract = new ethers.Contract(
    serviceRegistryAddress,
    serviceRegistryAbi,
    provider,
  );

  return { provider, serviceRegistryContract, serviceRegistryAddress };
};

/**
 * The description in the service's own config (its on-chain `configHash` on
 * IPFS), or ''. One RPC attempt, and the whole read gives up after
 * RPC_READ_TIMEOUT_MS, like the mech payment read in the same routes.
 */
export const getServiceConfigDescription = async (
  chainId: number,
  serviceId: string,
): Promise<string> => {
  const rpcUrl = RPC_URLS[chainId];
  if (!rpcUrl) return '';
  const provider = singleAttemptProvider(rpcUrl);
  try {
    const registryCtx = buildServiceRegistryContext(
      chainId as keyof typeof ADDRESSES,
      rpcUrl,
      provider,
    );
    if (!registryCtx) return '';
    const read = async () => {
      const service = await registryCtx.serviceRegistryContract.getService(serviceId);
      const config = await getIpfsResponse(service.configHash);
      return asText(config?.description);
    };
    return await withTimeout(read(), RPC_READ_TIMEOUT_MS, `service ${serviceId} config read`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`Could not read the config of service ${serviceId} on chain ${chainId}:`, message);
    return '';
  } finally {
    provider.destroy();
  }
};

/**
 * Normalize a tool schema from IPFS metadata so that:
 * 1. `type: "text"` becomes `type: "string"`.
 * 2. If a nested `schema` wrapper exists, its properties are spread to the
 *    top level and the wrapper is removed.
 * Null when the tool publishes no schema, so callers omit the field. */
export const normalizeToolSchema = (
  raw: ToolInputOutput | undefined,
): { type: string; description: string } | null => {
  if (!raw || typeof raw !== 'object') return null;
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
