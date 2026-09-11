import { list, put } from '@vercel/blob';

/**
 * Blob-backed read-through cache for per-contract data that does not change: staking config and
 * IPFS metadata. Live values (available rewards, service ids, epoch counters) are never cached.
 *
 * Server-only — it imports `@vercel/blob`, so it is deliberately NOT exported from this lib's
 * barrel, for the same reason `estimateGasWithBuffer` is not. Import it by path.
 *
 * The store is generic over the cached payload because operate and govern cache genuinely
 * different shapes: govern reads 13 contract fields, operate 6, and they disagree on the type of
 * `maxNumServices` (string vs number). Sharing one store between them would need those two
 * fetchers and schemas unified first; this shares the storage logic, not the data.
 */

export type ContractCacheSnapshot<T> = {
  data: T;
  timestamp: number;
};

export const isContractCacheSnapshot = <T>(data: unknown): data is ContractCacheSnapshot<T> =>
  typeof data === 'object' && data !== null && 'data' in data && 'timestamp' in data;

type ContractCacheStoreOptions = {
  /**
   * Versioned path prefix, e.g. `operate/contracts/v1`. Bump it when the cached shape or the
   * rules for what may be cached change, so stale snapshots are treated as misses.
   */
  prefix: string;
  /**
   * Resolves the blob token at call time rather than module load, so it picks up the
   * environment the request actually runs in. Two callers given the same token and prefix
   * share one cache.
   */
  getToken: () => string | undefined;
};

export function createContractCacheStore<T>({ prefix, getToken }: ContractCacheStoreOptions) {
  const blobPath = (chainId: number, address: string) =>
    `${prefix}/${chainId}/${address.toLowerCase()}.json`;

  /** Reads a cached snapshot. Returns null on a miss, a malformed payload, or any error. */
  async function getContractCache(
    chainId: number,
    address: string,
  ): Promise<ContractCacheSnapshot<T> | null> {
    try {
      const path = blobPath(chainId, address);
      const { blobs } = await list({ prefix: path, limit: 1, token: getToken() });

      const blob = blobs.find((b) => b.pathname === path);
      if (!blob) return null;

      const response = await fetch(blob.url, { cache: 'no-store' });
      if (!response.ok) return null;

      const data = await response.json();
      return isContractCacheSnapshot<T>(data) ? data : null;
    } catch {
      return null;
    }
  }

  /**
   * Writes a snapshot, stamping it. Rethrows, so callers decide whether a failed warm matters.
   * With no token configured it does nothing: the store owns the token, so callers do not have
   * to check for it before deciding whether a warm is possible.
   */
  async function setContractCache(chainId: number, address: string, data: T): Promise<void> {
    if (!getToken()) return;

    const path = blobPath(chainId, address);
    const snapshot: ContractCacheSnapshot<T> = { data, timestamp: Date.now() };

    try {
      await put(path, JSON.stringify(snapshot, null, 2), {
        access: 'public',
        addRandomSuffix: false,
        // @vercel/blob >= 1.0 throws on an existing path without this; the path is fixed by design.
        allowOverwrite: true,
        contentType: 'application/json',
        // 60 s is the SDK minimum. Well inside the 5-minute ISR window this cache sits behind.
        cacheControlMaxAge: 60,
        token: getToken(),
      });
    } catch (error) {
      console.error('Contract cache blob put failed:', { chainId, address, path }, error);
      throw error;
    }
  }

  return { getContractCache, setContractCache };
}
