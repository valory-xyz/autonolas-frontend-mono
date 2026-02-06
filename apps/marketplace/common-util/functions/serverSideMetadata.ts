import { ethers } from 'ethers';
import { kebabCase } from 'lodash';
import { mainnet, gnosis, polygon, arbitrum, base, optimism, celo, mode } from 'viem/chains';

import { RPC_URLS } from 'libs/util-constants/src';
import { isL1Network } from 'libs/util-functions/src';

import { AGENT_REGISTRY_CONTRACT } from 'common-util/AbiAndAddresses/agentRegistry';
import { COMPONENT_REGISTRY_CONTRACT } from 'common-util/AbiAndAddresses/componentRegistry';
import { SERVICE_REGISTRY_CONTRACT } from 'common-util/AbiAndAddresses/serviceRegistry';
import { SERVICE_REGISTRY_L2 } from 'common-util/AbiAndAddresses/serviceRegistryL2';
import { ADDRESSES, type ChainIds } from 'common-util/Contracts/addresses';
import { SUPPORTED_CHAINS } from 'common-util/Login/config';
import {
  metadataToServiceMetadataDisplay,
  type ServiceMetadataDisplay,
} from 'common-util/functions/ipfs';
import { normalizeMetadataUrl, resolveUnitMetadataUrl } from 'common-util/functions/tokenUri';

const IPFS_TIMEOUT = 5_000;

/** Get service registry address for a chain from shared ADDRESSES (L1: serviceRegistry, L2: serviceRegistryL2) */
const getServiceRegistryAddress = (chainId: number): string | undefined => {
  const addresses = ADDRESSES[chainId as ChainIds];
  if (!addresses) return undefined;
  return isL1Network(chainId)
    ? (addresses as { serviceRegistry: string }).serviceRegistry
    : (addresses as { serviceRegistryL2: string }).serviceRegistryL2;
};

// Map URL network slug to chain ID (used in routes e.g. /ethereum/..., /op-mainnet/...)
const NETWORK_TO_CHAIN_ID: Record<string, number> = {
  ethereum: mainnet.id,
  gnosis: gnosis.id,
  polygon: polygon.id,
  'arbitrum-one': arbitrum.id,
  base: base.id,
  'op-mainnet': optimism.id,
  celo: celo.id,
  'mode-mainnet': mode.id,
};

export type ServiceMetadata = ServiceMetadataDisplay;

/**
 * Get chain ID from network name
 */
export const getChainIdFromNetwork = (network: string): number | null => {
  // Direct match
  if (NETWORK_TO_CHAIN_ID[network]) {
    return NETWORK_TO_CHAIN_ID[network];
  }

  // Try kebab-case matching against chain names
  const chain = SUPPORTED_CHAINS.find((c) => kebabCase(c.name) === network);
  return chain?.id ?? null;
};

/**
 * Fetch metadata from a URL (IPFS gateway or normalized token URI) with timeout
 */
const fetchMetadataFromUrl = async (
  url: string,
): Promise<{
  name?: string;
  description?: string;
  image?: string;
} | null> => {
  if (!url) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), IPFS_TIMEOUT);

    const response = await fetch(url, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching metadata from URL:', error);
    return null;
  }
};

/**
 * Fetch service token URI from contract
 */
const getServiceTokenUri = async (chainId: number, serviceId: string): Promise<string | null> => {
  const rpcUrl = RPC_URLS[chainId];
  if (!rpcUrl) {
    console.error(`No RPC URL configured for chainId: ${chainId}`);
    return null;
  }

  const registryAddress = getServiceRegistryAddress(chainId);
  if (!registryAddress) {
    console.error(`No service registry address for chainId: ${chainId}`);
    return null;
  }

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const abi = isL1Network(chainId) ? SERVICE_REGISTRY_CONTRACT.abi : SERVICE_REGISTRY_L2.abi;
    const contract = new ethers.Contract(registryAddress, abi, provider);

    const tokenUri = await contract.tokenURI(serviceId);
    return tokenUri;
  } catch (error) {
    console.error('Error fetching token URI:', error);
    return null;
  }
};

/**
 * Fetch service metadata server-side for SEO
 * @param network - Network name from URL (e.g., "ethereum", "gnosis")
 * @param serviceId - Service ID
 * @returns Service metadata (name, description, imageUrl)
 */
export const getServiceMetadataServerSide = async (
  network: string,
  serviceId: string,
): Promise<ServiceMetadata> => {
  const defaultMetadata: ServiceMetadata = metadataToServiceMetadataDisplay(null);

  // Skip for Solana network (SVM)
  if (network === 'solana') {
    return defaultMetadata;
  }

  const chainId = getChainIdFromNetwork(network);
  if (!chainId) {
    console.error(`Unknown network: ${network}`);
    return defaultMetadata;
  }

  try {
    // Get token URI from contract
    const tokenUri = await getServiceTokenUri(chainId, serviceId);
    if (!tokenUri) {
      return defaultMetadata;
    }

    // Fetch metadata from IPFS
    const metadata = await fetchMetadataFromUrl(normalizeMetadataUrl(tokenUri));
    if (!metadata) {
      return defaultMetadata;
    }

    return metadataToServiceMetadataDisplay(metadata);
  } catch (error) {
    console.error('Error fetching service metadata:', error);
    return defaultMetadata;
  }
};

/**
 * Get agent token URI (mainnet only - agent registry is L1).
 * Uses same resolution logic as ListAgents/utils getTokenUri via resolveUnitMetadataUrl.
 */
const getAgentTokenUri = async (unitId: string): Promise<string | null> => {
  const rpcUrl = RPC_URLS[mainnet.id];
  if (!rpcUrl) return null;

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(
      ADDRESSES[mainnet.id].agentRegistry,
      AGENT_REGISTRY_CONTRACT.abi,
      provider,
    );

    const updatedHashes = await contract.getUpdatedHashes(unitId);
    const unitHashes = updatedHashes.unitHashes ?? updatedHashes[1];
    const tokenUri = unitHashes?.length ? null : await contract.tokenURI(unitId);
    return resolveUnitMetadataUrl(unitHashes ?? null, tokenUri) || null;
  } catch (error) {
    console.error('Error fetching agent token URI:', error);
    return null;
  }
};

/**
 * Get component token URI (mainnet only - component registry is L1).
 * Uses same resolution logic as ListComponents/utils getTokenUri via resolveUnitMetadataUrl.
 */
const getComponentTokenUri = async (unitId: string): Promise<string | null> => {
  const rpcUrl = RPC_URLS[mainnet.id];
  if (!rpcUrl) return null;

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(
      ADDRESSES[mainnet.id].componentRegistry,
      COMPONENT_REGISTRY_CONTRACT.abi,
      provider,
    );

    const updatedHashes = await contract.getUpdatedHashes(unitId);
    const unitHashes = updatedHashes.unitHashes ?? updatedHashes[1];
    const tokenUri = unitHashes?.length ? null : await contract.tokenURI(unitId);
    return resolveUnitMetadataUrl(unitHashes ?? null, tokenUri) || null;
  } catch (error) {
    console.error('Error fetching component token URI:', error);
    return null;
  }
};

/**
 * Fetch agent blueprint metadata server-side for SEO (mainnet only)
 */
export const getAgentMetadataServerSide = async (
  network: string,
  unitId: string,
): Promise<ServiceMetadata> => {
  const defaultMetadata: ServiceMetadata = metadataToServiceMetadataDisplay(null);

  // Agent registry is L1 (mainnet) only
  if (getChainIdFromNetwork(network) !== mainnet.id) {
    return defaultMetadata;
  }

  try {
    const metadataUrl = await getAgentTokenUri(unitId);
    if (!metadataUrl) return defaultMetadata;

    const metadata = await fetchMetadataFromUrl(metadataUrl);
    if (!metadata) return defaultMetadata;

    return metadataToServiceMetadataDisplay(metadata);
  } catch (error) {
    console.error('Error fetching agent metadata:', error);
    return defaultMetadata;
  }
};

/**
 * Fetch component metadata server-side for SEO (mainnet only)
 */
export const getComponentMetadataServerSide = async (
  network: string,
  unitId: string,
): Promise<ServiceMetadata> => {
  const defaultMetadata: ServiceMetadata = metadataToServiceMetadataDisplay(null);

  // Component registry is L1 (mainnet) only
  if (getChainIdFromNetwork(network) !== mainnet.id) {
    return defaultMetadata;
  }

  try {
    const metadataUrl = await getComponentTokenUri(unitId);
    if (!metadataUrl) return defaultMetadata;

    const metadata = await fetchMetadataFromUrl(metadataUrl);
    if (!metadata) return defaultMetadata;

    return metadataToServiceMetadataDisplay(metadata);
  } catch (error) {
    console.error('Error fetching component metadata:', error);
    return defaultMetadata;
  }
};
