import type { NextApiRequest, NextApiResponse } from 'next';
import { isAddress } from 'viem';

import { getContractCache, setContractCache } from 'common-util/blob';
import { fetchContractCacheDataFromChain } from 'common-util/fetch-contract-cache-data';
import type { GovernContractCacheSnapshot } from 'types';

type NomineeInput = { chainId: number; address: string };
type BatchResponse = Record<string, GovernContractCacheSnapshot>;

/** Maximum nominees per batch to prevent abuse. */
const MAX_BATCH_SIZE = 200;

/** Concurrency limit for cache-miss RPC fetches. */
const CONCURRENCY_LIMIT = 5;

/**
 * Runs promises with bounded concurrency.
 */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const i = nextIndex++;
      results[i] = await fn(items[i]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  const { nominees } = req.body as { nominees?: NomineeInput[] };
  if (!Array.isArray(nominees) || nominees.length === 0) {
    return res.status(400).json({ error: 'Missing or empty nominees array' });
  }

  if (nominees.length > MAX_BATCH_SIZE) {
    return res.status(400).json({ error: `Batch size exceeds maximum of ${MAX_BATCH_SIZE}` });
  }

  const invalidIndex = nominees.findIndex(
    (n) =>
      typeof n.address !== 'string' ||
      !isAddress(n.address) ||
      !Number.isFinite(n.chainId) ||
      !Number.isInteger(n.chainId) ||
      n.chainId <= 0,
  );
  if (invalidIndex !== -1) {
    return res.status(400).json({ error: `Invalid nominee at index ${invalidIndex}` });
  }

  const result: BatchResponse = {};

  // Phase 1: Check blob cache for all nominees in parallel
  const cacheResults = await Promise.allSettled(
    nominees.map(async (n) => {
      const snapshot = await getContractCache(n.chainId, n.address);
      return { key: `${n.chainId}:${n.address.toLowerCase()}`, snapshot, nominee: n };
    }),
  );

  const cacheMisses: NomineeInput[] = [];

  for (const r of cacheResults) {
    if (r.status === 'fulfilled' && r.value.snapshot) {
      result[r.value.key] = r.value.snapshot;
    } else if (r.status === 'fulfilled') {
      cacheMisses.push(r.value.nominee);
    }
  }

  // Phase 2: Fetch cache misses from chain with bounded concurrency
  if (cacheMisses.length > 0) {
    await mapWithConcurrency(cacheMisses, CONCURRENCY_LIMIT, async (n) => {
      try {
        const data = await fetchContractCacheDataFromChain(n.chainId, n.address);
        if (data) {
          await setContractCache(n.chainId, n.address, data);
          const key = `${n.chainId}:${n.address.toLowerCase()}`;
          result[key] = { data, timestamp: Date.now() };
        }
      } catch (error) {
        console.error(`Batch cache miss fetch failed for ${n.chainId}:${n.address}`, error);
      }
    });
  }

  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  return res.status(200).json(result);
}
