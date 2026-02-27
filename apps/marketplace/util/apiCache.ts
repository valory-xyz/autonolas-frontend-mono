type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const cache = new Map<string, CacheEntry<unknown>>();

const MAX_ENTRIES = 100;
const DEFAULT_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours, matches Cache-Control s-maxage
const MAX_STALE_MS = 24 * 60 * 60 * 1000; // 24 hours, hard cap for stale fallbacks

/**
 * Returns cached data if it exists and is within TTL.
 * Promotes the entry to most-recently-used on hit.
 */
export function getCached<T>(key: string, ttlMs: number = DEFAULT_TTL_MS): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ttlMs) return null;

  // Move to end of Map (most recently used) for LRU ordering
  cache.delete(key);
  cache.set(key, entry);

  return entry.data as T;
}

/**
 * Returns cached data even if past TTL, up to MAX_STALE_MS (24h).
 * Entries older than 24h are evicted and null is returned.
 */
export function getStaleFallback<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > MAX_STALE_MS) {
    cache.delete(key);
    return null;
  }

  return entry.data as T;
}

/**
 * Stores data in the cache. Evicts the least-recently-used entry
 * if the cache has reached MAX_ENTRIES.
 */
export function setCache<T>(key: string, data: T): void {
  // Delete first so re-insert moves key to end of Map
  cache.delete(key);

  if (cache.size >= MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) {
      cache.delete(oldestKey);
    }
  }

  cache.set(key, { data, timestamp: Date.now() });
}
