import { list, put } from '@vercel/blob';

import type { GovernContractCacheData, GovernContractCacheSnapshot } from 'types';

const BLOB_PREFIX = 'govern/contracts';

function blobPath(chainId: number, address: string): string {
  return `${BLOB_PREFIX}/${chainId}/${address.toLowerCase()}.json`;
}

export const isGovernContractCacheSnapshot = (data: unknown): data is GovernContractCacheSnapshot =>
  typeof data === 'object' && data !== null && 'data' in data && 'timestamp' in data;

/**
 * Reads cached contract snapshot from blob. Returns null on miss or error.
 */
export async function getContractCache(
  chainId: number,
  address: string,
): Promise<GovernContractCacheSnapshot | null> {
  try {
    const path = blobPath(chainId, address);
    const { blobs } = await list({ prefix: path, limit: 1 });

    const blob = blobs.find((b) => b.pathname === path);
    if (!blob) return null;

    const response = await fetch(blob.url, { cache: 'no-store' });
    if (!response.ok) return null;

    const data = await response.json();
    return isGovernContractCacheSnapshot(data) ? data : null;
  } catch {
    return null;
  }
}

/**
 * Writes contract data to blob, setting timestamp automatically.
 */
export async function setContractCache(
  chainId: number,
  address: string,
  data: GovernContractCacheData,
): Promise<void> {
  const path = blobPath(chainId, address);
  const snapshot: GovernContractCacheSnapshot = {
    data,
    timestamp: Date.now(),
  };
  await put(path, JSON.stringify(snapshot, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
    cacheControlMaxAge: 0,
  });
}
