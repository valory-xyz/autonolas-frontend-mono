import { ContributeAgent } from 'types/users';

import { fetchLeaderboardData } from './fetchLeaderboardData';

/**
 * How long one read is reused. Deliberately far shorter than the pages' own revalidate windows,
 * so this only ever collapses reads that happen close together — it is not a second cache layer
 * with its own staleness to reason about.
 */
const TTL_MS = 60_000;

let inFlight: Promise<ContributeAgent[]> | null = null;
let cached: { at: number; agents: ContributeAgent[] } | null = null;

/**
 * The leaderboard read for pre-rendering paths, shared across pages.
 *
 * Every regeneration costs seven sequential AFMDB pages and ~6k rows, and `/profile/[id]` needs
 * exactly one wallet out of that. A crawler walking profile URLs therefore used to trigger one
 * full read per address. Caching the *promise* means a burst of regenerations waits on a single
 * fetch rather than starting one each.
 *
 * Only for `getStaticProps`. `/api/leaderboard` — what the browser polls for live rows — is
 * deliberately left uncached.
 *
 * This is per server instance and is lost when one is recycled, which is fine: it exists to
 * collapse bursts, and the pages' ISR windows are what actually bound how often AFMDB is read.
 */
export const readLeaderboardForPrerender = async (): Promise<ContributeAgent[]> => {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.agents;
  if (inFlight) return inFlight;

  inFlight = fetchLeaderboardData()
    .then((agents) => {
      cached = { at: Date.now(), agents };
      return agents;
    })
    .finally(() => {
      // Cleared either way: a failed read must not pin every later caller to the same rejection.
      inFlight = null;
    });

  return inFlight;
};

/** Test seam — the module-level cache would otherwise leak between cases. */
export const resetLeaderboardCache = () => {
  inFlight = null;
  cached = null;
};
