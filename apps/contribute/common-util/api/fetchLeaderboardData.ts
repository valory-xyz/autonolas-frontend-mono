import { ContributeAgent } from 'types/users';

import { AfmdbError, getAfmdbAttributeValuesUrl } from './afmdb';

/**
 * Well above the ~6,200 rows the table holds today. Hitting it is an error, not a cue to page:
 * AFMDB returns rows in no stable order and ignores `order_by`, so `skip`/`limit` pages overlap
 * and drop rows — a paged read came back with duplicates and 50–90% of the real set.
 */
const LIMIT = 50_000;

/** Fetches all leaderboard rows from AFMDB in one request. Shared by the API route and the snapshot. */
export async function fetchLeaderboardData(): Promise<ContributeAgent[]> {
  const url = `${getAfmdbAttributeValuesUrl('USER')}?skip=0&limit=${LIMIT}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new AfmdbError(`Failed to fetch leaderboard: ${response.status}`, response.status);
  }

  const rows: ContributeAgent[] = await response.json();

  if (!Array.isArray(rows)) {
    throw new Error('Leaderboard response was not a list');
  }
  if (rows.length >= LIMIT) {
    throw new Error(`Leaderboard has reached the ${LIMIT}-row fetch limit; raise it`);
  }

  return rows;
}
