import { getIpfsUrl } from 'common-util/functions/ipfs';

/**
 * Normalize token URI to a fetchable URL.
 * Handles:
 * - IPFS hashes (raw hashes like Qm... or bafy...) → converted to gateway URL
 * - Already-resolved gateway URLs (https://gateway/...) → passed through unchanged
 *
 * Shared by serverSideMetadata and ListServices getTokenUri.
 */
export const normalizeMetadataUrl = (tokenUri: string | null | undefined): string => {
  const s = tokenUri ?? '';
  if (!s) return '';

  if (s.startsWith('http')) {
    return s;
  }

  return getIpfsUrl(s);
};

/**
 * Resolve agent/component unit metadata URL from updated hashes or token URI.
 * @param unitHashes - From contract getUpdatedHashes (array or array-like)
 * @param tokenUri - Raw token URI when no updated hashes (from contract tokenURI)
 */
export const resolveUnitMetadataUrl = (
  unitHashes: ArrayLike<unknown> | null | undefined,
  tokenUri: string | null | undefined,
): string => {
  const length = unitHashes?.length ?? 0;
  if (length > 0) {
    const last = unitHashes?.[length - 1];
    const hashStr =
      typeof last === 'string'
        ? last
        : ((last as { toString?: () => string })?.toString?.() ?? String(last));
    return getIpfsUrl(hashStr);
  }
  return normalizeMetadataUrl(tokenUri);
};
