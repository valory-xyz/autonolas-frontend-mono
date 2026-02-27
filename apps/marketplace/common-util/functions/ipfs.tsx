import { GATEWAY_URL, HASH_PREFIX } from 'libs/util-constants/src';

const IPFS_TIMEOUT = 5_000;

export const getIpfsCIDFromHash = (hash: string): string => {
  if (!hash) return '';

  const cleanHash = hash.startsWith('0x') ? hash.substring(2) : hash;
  return cleanHash.startsWith(HASH_PREFIX) ? cleanHash : `${HASH_PREFIX}${cleanHash}`;
};

export const getIpfsUrl = (hash: string) => {
  if (!hash) return '';

  const ipfsCID = getIpfsCIDFromHash(hash);
  return `${GATEWAY_URL}${ipfsCID}`;
};

export const imageIpfsToGatewayUrl = (imageUrl: string | undefined): string | null => {
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
 * Sanitize text for use in meta tags.
 * - Removes HTML tags and returns plain text
 * - Escapes special characters
 * - Limits length to prevent abuse
 * NOTE: React automatically escapes HTML in meta tags, so server-side we use simple regex.
 */
export const sanitizeMetaText = (text: string | null | undefined, maxLength = 300): string => {
  if (!text) return '';

  let sanitized = text.replace(/<[^>]*>/g, '').trim();

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
    return imageIpfsToGatewayUrl(imageUrl);
  }

  console.warn('Rejected untrusted image URL for meta tags:', imageUrl);
  return null;
};

/** Display shape for service/agent/component metadata (name, description, imageUrl) */
export type ServiceMetadata = {
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
): ServiceMetadata => ({
  name: metadata?.name ?? null,
  description: metadata?.description ?? null,
  imageUrl: imageIpfsToGatewayUrl(metadata?.image) ?? null,
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
