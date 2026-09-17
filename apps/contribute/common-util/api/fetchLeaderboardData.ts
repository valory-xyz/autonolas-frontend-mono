import { ContributeAgent } from 'types/users';

import { AfmdbError, getAfmdbAttributeValuesUrl } from './afmdb';

/**
 * Well above the ~6,200 rows the USER attribute holds today, so the whole leaderboard comes
 * back from one query. AFMDB's `values` endpoint has no ORDER BY, so `skip` pages are cut
 * from an arbitrary order: walking it in pages of 1,000 returned a third of the rows twice
 * and missed as many entirely, differently on every fetch. One query is one consistent
 * snapshot.
 */
const LIMIT = 20000;

/**
 * How long one fetched leaderboard is reused by every page and API route on this instance.
 * Shorter than the browser's one-minute poll (`useHealthCheckup`), so each poll gets a fresh
 * snapshot rather than one up to a minute old on top of its own interval.
 */
const REUSE_MS = 30_000;

let cached: { at: number; result: Promise<ContributeAgent[]> } | null = null;

const fetchAllRows = async (): Promise<ContributeAgent[]> => {
  const baseUrl = getAfmdbAttributeValuesUrl('USER');

  let skip = 0;
  let allResults: ContributeAgent[] = [];

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const url = `${baseUrl}?skip=${skip}&limit=${LIMIT}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new AfmdbError(`Failed to fetch leaderboard: ${response.status}`, response.status);
    }

    const pageData = await response.json();

    allResults = allResults.concat(pageData);
    skip += LIMIT;

    if (!Array.isArray(pageData) || pageData.length === 0 || pageData.length < LIMIT) {
      break;
    }
    console.warn(
      `[contribute/leaderboard] more than ${LIMIT} rows; paging is unordered, raise LIMIT`,
    );
  }

  // Belt and braces: the same row twice would render twice and share a React key.
  const byId = new Map(allResults.map((row) => [row.attribute_id, row]));
  return [...byId.values()];
};

/**
 * Fetches the whole leaderboard from AFMDB. Usable from API routes and `getServerSideProps` /
 * `getStaticProps` alike.
 *
 * The 4 MB result is shared for a minute across the homepage (rendered per request), profile
 * pages (rendered on first visit) and `/api/leaderboard` on a warm instance, so a crawl of the
 * profiles does not re-download it per page. A failed fetch is not kept.
 */
export async function fetchLeaderboardData(): Promise<ContributeAgent[]> {
  const now = Date.now();
  if (cached && now - cached.at < REUSE_MS) return cached.result;

  const result = fetchAllRows();
  const entry = { at: now, result };
  cached = entry;
  result.catch(() => {
    if (cached === entry) cached = null;
  });
  return result;
}
