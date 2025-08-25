import { notifyError } from '@autonolas/frontend-library';
import { GATEWAY_URL, HASH_PREFIX } from 'libs/util-constants/src';

export const getIpfsUrl = (hash: string) => {
  if (!hash) return '';

  const cleanHash = hash.startsWith('0x') ? hash.substring(2) : hash;
  const hasHashPrefix = cleanHash.startsWith(HASH_PREFIX);
  return hasHashPrefix ? `${GATEWAY_URL}${cleanHash}` : `${GATEWAY_URL}${HASH_PREFIX}${cleanHash}`;
};

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
    const response = await fetch(getIpfsUrl(hash));
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error fetching metadata from IPFS:', errorMessage);
    notifyError('Error fetching metadata from IPFS');
    return null;
  }
};
