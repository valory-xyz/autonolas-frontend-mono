import { GATEWAY_URL } from 'libs/util-constants/src';

import { getIpfsUrl } from 'common-util/functions/ipfs';

export const LOCALHOST_URI_PATTERN = /https:\/\/localhost\/(agent|component|service)\/+/;

/**
 * Normalize Autonolas token URI by replacing localhost placeholder with IPFS gateway URL.
 * @param tokenUri - Raw token URI (may be null/undefined)
 * @returns Fetchable URL with localhost placeholder replaced by GATEWAY_URL
 */
export const normalizeAutonolasTokenUri = (tokenUri: string | null | undefined): string =>
  (tokenUri ?? '').replace(LOCALHOST_URI_PATTERN, GATEWAY_URL);

/**
 * Normalize token URI to a fetchable URL (localhost placeholder or IPFS hash).
 * Shared by serverSideMetadata and ListServices getTokenUri.
 */
export const normalizeMetadataUrl = (tokenUri: string | null | undefined): string => {
  const s = tokenUri ?? '';
  if (!s) return '';
  if (s.startsWith('http')) return normalizeAutonolasTokenUri(s);
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
    const last = unitHashes![length - 1];
    const hashStr =
      typeof last === 'string'
        ? last
        : ((last as { toString?: () => string })?.toString?.() ?? String(last));
    return getIpfsUrl(hashStr);
  }
  return normalizeMetadataUrl(tokenUri);
};
