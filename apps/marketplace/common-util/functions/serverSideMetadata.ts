import { ethers } from 'ethers';
import { kebabCase } from 'lodash';
import { mainnet, gnosis, polygon, arbitrum, base, optimism, celo, mode } from 'viem/chains';

import { GATEWAY_URL, HASH_PREFIX } from 'libs/util-constants/src';
import { isL1Network } from 'libs/util-functions/src';

import { AGENT_REGISTRY_CONTRACT } from 'common-util/AbiAndAddresses/agentRegistry';
import { COMPONENT_REGISTRY_CONTRACT } from 'common-util/AbiAndAddresses/componentRegistry';
import { SERVICE_REGISTRY_CONTRACT } from 'common-util/AbiAndAddresses/serviceRegistry';
import { SERVICE_REGISTRY_L2 } from 'common-util/AbiAndAddresses/serviceRegistryL2';

const IPFS_TIMEOUT = 5_000;

// RPC URLs for server-side usage
const SERVER_RPC_URLS: Record<number, string | undefined> = {
  1: process.env.NEXT_PUBLIC_MAINNET_URL,
  10: process.env.NEXT_PUBLIC_OPTIMISM_URL,
  100: process.env.NEXT_PUBLIC_GNOSIS_URL,
  137: process.env.NEXT_PUBLIC_POLYGON_URL,
  8453: process.env.NEXT_PUBLIC_BASE_URL,
  34443: process.env.NEXT_PUBLIC_MODE_URL,
  42220: process.env.NEXT_PUBLIC_CELO_URL,
  42161: process.env.NEXT_PUBLIC_ARBITRUM_URL,
};

// Contract addresses per chain
const SERVICE_REGISTRY_ADDRESSES: Record<number, string> = {
  [mainnet.id]: '0x48b6af7B12C71f09e2fC8aF4855De4Ff54e775cA',
  [gnosis.id]: '0x9338b5153AE39BB89f50468E608eD9d764B755fD',
  [polygon.id]: '0xE3607b00E75f6405248323A9417ff6b39B244b50',
  [arbitrum.id]: '0xE3607b00E75f6405248323A9417ff6b39B244b50',
  [base.id]: '0x3C1fF68f5aa342D296d4DEe4Bb1cACCA912D95fE',
  [optimism.id]: '0x3d77596beb0f130a4415df3D2D8232B3d3D31e44',
  [celo.id]: '0xE3607b00E75f6405248323A9417ff6b39B244b50',
  [mode.id]: '0x3C1fF68f5aa342D296d4DEe4Bb1cACCA912D95fE',
};

const AGENT_REGISTRY_ADDRESS = '0x2F1f7D38e4772884b88f3eCd8B6b9faCdC319112';
const COMPONENT_REGISTRY_ADDRESS = '0x15bd56669F57192a97dF41A2aa8f4403e9491776';

const LOCALHOST_URI_PATTERN = /https:\/\/localhost\/(agent|component|service)\/+/g;

// Map network name to chain ID
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

// Supported chains for mapping
const SUPPORTED_CHAINS = [mainnet, gnosis, polygon, arbitrum, base, optimism, celo, mode];

export type ServiceMetadata = {
  name: string | null;
  description: string | null;
  imageUrl: string | null;
};

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
 * Get IPFS URL from hash
 */
const getIpfsUrl = (hash: string): string => {
  if (!hash) return '';

  const cleanHash = hash.startsWith('0x') ? hash.substring(2) : hash;
  const hasHashPrefix = cleanHash.startsWith(HASH_PREFIX);
  return hasHashPrefix ? `${GATEWAY_URL}${cleanHash}` : `${GATEWAY_URL}${HASH_PREFIX}${cleanHash}`;
};

/**
 * Transform IPFS image URL to gateway URL
 */
const transformImageUrl = (imageUrl: string | undefined): string | null => {
  if (!imageUrl) return null;
  return imageUrl.replace('ipfs://', GATEWAY_URL);
};

/**
 * Normalize token URI to a fetchable URL (handles localhost placeholder and hashes)
 */
const normalizeMetadataUrl = (tokenUri: string): string => {
  if (!tokenUri) return '';
  if (tokenUri.startsWith('http')) {
    return tokenUri.replace(LOCALHOST_URI_PATTERN, GATEWAY_URL);
  }
  return getIpfsUrl(tokenUri);
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
  const rpcUrl = SERVER_RPC_URLS[chainId];
  if (!rpcUrl) {
    console.error(`No RPC URL configured for chainId: ${chainId}`);
    return null;
  }

  const registryAddress = SERVICE_REGISTRY_ADDRESSES[chainId];
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
  const defaultMetadata: ServiceMetadata = {
    name: null,
    description: null,
    imageUrl: null,
  };

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

    return {
      name: metadata.name || null,
      description: metadata.description || null,
      imageUrl: transformImageUrl(metadata.image),
    };
  } catch (error) {
    console.error('Error fetching service metadata:', error);
    return defaultMetadata;
  }
};

/**
 * Get agent token URI (mainnet only - agent registry is L1)
 */
const getAgentTokenUri = async (unitId: string): Promise<string | null> => {
  const rpcUrl = SERVER_RPC_URLS[mainnet.id];
  if (!rpcUrl) return null;

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(
      AGENT_REGISTRY_ADDRESS,
      AGENT_REGISTRY_CONTRACT.abi,
      provider,
    );

    const updatedHashes = await contract.getUpdatedHashes(unitId);
    const unitHashes = updatedHashes.unitHashes ?? updatedHashes[1];

    if (unitHashes?.length > 0) {
      const lastHash = unitHashes[unitHashes.length - 1];
      const hashHex = typeof lastHash === 'string' ? lastHash : lastHash;
      const cleanHash = hashHex.startsWith('0x') ? hashHex.substring(2) : hashHex;
      const hasPrefix = cleanHash.startsWith(HASH_PREFIX);
      return hasPrefix ? `${GATEWAY_URL}${cleanHash}` : `${GATEWAY_URL}${HASH_PREFIX}${cleanHash}`;
    }

    const tokenUri = await contract.tokenURI(unitId);
    return tokenUri ? normalizeMetadataUrl(tokenUri) : null;
  } catch (error) {
    console.error('Error fetching agent token URI:', error);
    return null;
  }
};

/**
 * Get component token URI (mainnet only - component registry is L1)
 */
const getComponentTokenUri = async (unitId: string): Promise<string | null> => {
  const rpcUrl = SERVER_RPC_URLS[mainnet.id];
  if (!rpcUrl) return null;

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(
      COMPONENT_REGISTRY_ADDRESS,
      COMPONENT_REGISTRY_CONTRACT.abi,
      provider,
    );

    const updatedHashes = await contract.getUpdatedHashes(unitId);
    const unitHashes = updatedHashes.unitHashes ?? updatedHashes[1];

    if (unitHashes?.length > 0) {
      const lastHash = unitHashes[unitHashes.length - 1];
      const hashHex = typeof lastHash === 'string' ? lastHash : lastHash;
      const cleanHash = hashHex.startsWith('0x') ? hashHex.substring(2) : hashHex;
      const hasPrefix = cleanHash.startsWith(HASH_PREFIX);
      return hasPrefix ? `${GATEWAY_URL}${cleanHash}` : `${GATEWAY_URL}${HASH_PREFIX}${cleanHash}`;
    }

    const tokenUri = await contract.tokenURI(unitId);
    return tokenUri ? normalizeMetadataUrl(tokenUri) : null;
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
  const defaultMetadata: ServiceMetadata = {
    name: null,
    description: null,
    imageUrl: null,
  };

  // Agent registry is L1 (mainnet) only
  if (getChainIdFromNetwork(network) !== mainnet.id) {
    return defaultMetadata;
  }

  try {
    const metadataUrl = await getAgentTokenUri(unitId);
    if (!metadataUrl) return defaultMetadata;

    const metadata = await fetchMetadataFromUrl(metadataUrl);
    if (!metadata) return defaultMetadata;

    return {
      name: metadata.name || null,
      description: metadata.description || null,
      imageUrl: transformImageUrl(metadata.image),
    };
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
  const defaultMetadata: ServiceMetadata = {
    name: null,
    description: null,
    imageUrl: null,
  };

  // Component registry is L1 (mainnet) only
  if (getChainIdFromNetwork(network) !== mainnet.id) {
    return defaultMetadata;
  }

  try {
    const metadataUrl = await getComponentTokenUri(unitId);
    if (!metadataUrl) return defaultMetadata;

    const metadata = await fetchMetadataFromUrl(metadataUrl);
    if (!metadata) return defaultMetadata;

    return {
      name: metadata.name || null,
      description: metadata.description || null,
      imageUrl: transformImageUrl(metadata.image),
    };
  } catch (error) {
    console.error('Error fetching component metadata:', error);
    return defaultMetadata;
  }
};
