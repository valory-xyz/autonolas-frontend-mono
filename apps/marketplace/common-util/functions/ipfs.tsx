import { GATEWAY_URL, HASH_PREFIX } from 'libs/util-constants/src';

const IPFS_TIMEOUT = 5_000;

export const getIpfsUrl = (hash: string) => {
  if (!hash) return '';

  const cleanHash = hash.startsWith('0x') ? hash.substring(2) : hash;
  const hasHashPrefix = cleanHash.startsWith(HASH_PREFIX);
  return hasHashPrefix ? `${GATEWAY_URL}${cleanHash}` : `${GATEWAY_URL}${HASH_PREFIX}${cleanHash}`;
};

/**
 * Transform IPFS image URL to gateway URL.
 * Handles:
 * - ipfs:// protocol URLs (ipfs://Qm... -> GATEWAY_URL/Qm...)
 * - Raw IPFS hashes (Qm... or bafy... -> GATEWAY_URL/ipfs/Qm...)
 * - Already-resolved gateway URLs (passed through unchanged)
 * Shared by server-side metadata and useMetadata hook.
 */
export const transformImageUrl = (imageUrl: string | undefined): string | null => {
  if (!imageUrl) return null;

  // Handle ipfs:// protocol
  if (imageUrl.startsWith('ipfs://')) {
    return imageUrl.replace('ipfs://', GATEWAY_URL);
  }

  // Handle raw IPFS hashes (Qm... or bafy...)
  const isRawHash = /^(Qm|bafy)[A-Za-z0-9]{40,}$/.test(imageUrl);
  if (isRawHash) {
    return getIpfsUrl(imageUrl);
  }

  return imageUrl;
};

/**
 * Sanitize text for use in meta tags by:
 * - Removing HTML tags
 * - Escaping special characters
 * - Limiting length to prevent abuse
 * NOTE: React automatically escapes HTML in meta tags.
 */
export const sanitizeMetaText = (text: string | null | undefined, maxLength = 300): string => {
  if (!text) return '';

  let sanitized = text.replace(/<[^>]*>/g, '');

  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength).trim() + '...';
  }

  return sanitized;
};

/**
 * Validate and sanitize image URL for use in meta tags.
 * Only allows URLs from trusted sources (GATEWAY_URL or relative paths).
 */
export const validateMetaImageUrl = (imageUrl: string | null | undefined): string | null => {
  if (!imageUrl) return null;

  if (imageUrl.startsWith('/')) {
    return imageUrl;
  }

  if (imageUrl.startsWith(GATEWAY_URL)) {
    return imageUrl;
  }

  if (imageUrl.startsWith('ipfs://') || /^(Qm|bafy)[A-Za-z0-9]{40,}$/.test(imageUrl)) {
    return transformImageUrl(imageUrl);
  }

  console.warn('Rejected untrusted image URL for meta tags:', imageUrl);
  return null;
};

/** Display shape for service/agent/component metadata (name, description, imageUrl) */
export type ServiceMetadataDisplay = {
  name: string | null;
  description: string | null;
  imageUrl: string | null;
};

/**
 * Map raw metadata JSON to display shape (name, description, imageUrl).
 * Reused by serverSideMetadata and consistent with List* utils usage.
 */
export const metadataToServiceMetadataDisplay = (
  metadata: { name?: string; description?: string; image?: string } | null | undefined,
): ServiceMetadataDisplay => ({
  name: metadata?.name ?? null,
  description: metadata?.description ?? null,
  imageUrl: transformImageUrl(metadata?.image) ?? null,
});

export type IpfsMetadata = {
  name?: string;
  description?: string;
  image?: string;
  code_uri?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  [key: string]: unknown;
};

/**
 * Fetches data from IPFS using the provided hash
 * @param {string} hash - The IPFS hash (with or without 0x prefix)
 * @returns {Promise<IpfsMetadata | null>} The parsed JSON data from IPFS or null if failed
 */
export const getIpfsResponse = async (hash: string): Promise<IpfsMetadata | null> => {
  if (!hash) {
    console.warn('No hash provided to getIpfsResponse');
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), IPFS_TIMEOUT);
    const response = await fetch(getIpfsUrl(hash), {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error fetching metadata from IPFS:', errorMessage);
    return null;
  }
};
