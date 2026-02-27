type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const cache = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours, matches Cache-Control s-maxage

/**
 * Returns cached data if it exists and is within TTL.
 */
export function getCached<T>(key: string, ttlMs: number = DEFAULT_TTL_MS): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ttlMs) return null;
  return entry.data as T;
}

/**
 * Returns cached data even if expired — used as a fallback when live fetches fail.
 */
export function getStaleFallback<T>(key: string): T | null {
  const entry = cache.get(key);
  return entry ? (entry.data as T) : null;
}

/**
 * Stores data in the cache.
 */
export function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}
