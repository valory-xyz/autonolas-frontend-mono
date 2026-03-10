/**
 * Blob storage for operate app: cached staking contract config, metadata, and operate-specific details.
 * These values do not change for a given contract, so they are stored in blob once and read from cache.
 * Live data (availableRewards, serviceIds, epochCounter, tsCheckpoint) is not cached.
 *
 * Read-through flow (in GET /api/contracts/[chainId]/[address]): call getContractCache; on miss,
 * fetch from chain via fetchContractCacheDataFromChain (RPC + IPFS), then setContractCache and return.
 */

import { list, put } from '@vercel/blob';
import type { ContractCacheData, ContractCacheSnapshot } from 'types';

const BLOB_PREFIX = 'operate/contracts';

function blobPath(chainId: number, address: string): string {
  const addr = address.toLowerCase();
  return `${BLOB_PREFIX}/${chainId}/${addr}.json`;
}

const isContractCacheSnapshot = (data: unknown): data is ContractCacheSnapshot =>
  typeof data === 'object' && data !== null && 'data' in data && 'timestamp' in data;

/**
 * Reads cached contract snapshot from blob. Returns null on miss or error.
 */
export async function getContractCache(
  chainId: number,
  address: string,
): Promise<ContractCacheSnapshot | null> {
  try {
    const path = blobPath(chainId, address);
    const token = process.env.OPERATE_BLOB_READ_WRITE_TOKEN;
    const { blobs } = await list({ prefix: path, limit: 1, token: token ?? undefined });

    const blob = blobs.find((b) => b.pathname === path);
    if (!blob) return null;

    const response = await fetch(blob.url, { cache: 'no-store' });
    if (!response.ok) return null;

    const data = await response.json();
    return isContractCacheSnapshot(data) ? data : null;
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
  data: ContractCacheData,
): Promise<void> {
  const path = blobPath(chainId, address);
  const snapshot: ContractCacheSnapshot = {
    data,
    timestamp: Date.now(),
  };
  try {
    const token = process.env.OPERATE_BLOB_READ_WRITE_TOKEN;
    await put(path, JSON.stringify(snapshot, null, 2), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json',
      cacheControlMaxAge: 0,
      token: token ?? undefined,
    });
  } catch (error) {
    console.error('Contract cache blob put failed:', { chainId, address, path }, error);
    throw error;
  }
}
