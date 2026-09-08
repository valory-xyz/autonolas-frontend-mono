import { GetStaticProps } from 'next';
import { PHASE_PRODUCTION_BUILD } from 'next/constants';

/** A point-in-time copy of remote data, plus when it was taken. */
export type Snapshot<T> = {
  data: T;
  /** ISO-8601 UTC, or null when the fetch failed and `data` is the empty value. */
  generatedAt: string | null;
};

type Options<T, P extends { [key: string]: unknown }> = {
  /** Fetches the data. Should reject, not resolve empty, when it cannot get it. */
  fetchSnapshot: () => Promise<T>;
  /** Rendered when the fetch fails during a build. Must not read as real data. */
  emptyValue: T;
  /** Upper bound on the fetch. Keep it below the deployment's function `maxDuration`. */
  timeoutMs: number;
  revalidateSeconds: number;
  /** Retry sooner after a failure so a stale snapshot is not held for a full window. */
  revalidateOnErrorSeconds: number;
  /** Identifies the page in error logs. */
  label: string;
  toProps: (snapshot: Snapshot<T>) => P;
};

/**
 * Builds a `getStaticProps` that pre-renders a remote-data snapshot into the HTML.
 *
 * The error handling is the part that matters. Returning empty props on failure looks like a
 * safe fallback, but to Next it is a *successful* render: it caches the empty result and
 * overwrites the last good page, so one RPC blip empties a working table. Instead:
 *
 * - **During revalidation**, rethrow. Next keeps serving the previous successful page and
 *   retries later — this is what "render the last known snapshot" actually requires.
 * - **During the build**, swallow. A throw here fails the whole build, and there is no previous
 *   page to fall back to. The page ships with `emptyValue` and the first revalidation fills it in.
 */
export function createSnapshotGetStaticProps<T, P extends { [key: string]: unknown }>({
  fetchSnapshot,
  emptyValue,
  timeoutMs,
  revalidateSeconds,
  revalidateOnErrorSeconds,
  label,
  toProps,
}: Options<T, P>): GetStaticProps<P> {
  return async () => {
    try {
      const data = await withTimeout(fetchSnapshot(), timeoutMs, label);
      return {
        props: toProps({ data, generatedAt: new Date().toISOString() }),
        revalidate: revalidateSeconds,
      };
    } catch (error) {
      console.error(`[${label}] snapshot fetch failed:`, error);

      if (process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD) {
        // Revalidation: let Next retain the last good page rather than caching an empty one.
        throw error;
      }

      return {
        props: toProps({ data: emptyValue, generatedAt: null }),
        revalidate: revalidateOnErrorSeconds,
      };
    }
  };
}

/**
 * Rejects when `promise` outlives `ms`.
 *
 * Note this bounds the wait, not the work: the underlying fetch keeps running. That is
 * acceptable here because a timeout ends the render anyway — during revalidation the rethrow
 * above ends the invocation, and during a build the process is short-lived. Cancelling for real
 * would mean threading an `AbortSignal` through every RPC and IPFS call in the fan-out.
 */
async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`[${label}] timed out after ${ms}ms`)), ms);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}
