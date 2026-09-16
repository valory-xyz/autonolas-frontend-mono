import { ContributeAgent } from 'types/users';

import { AfmdbError, getAfmdbAttributeValuesUrl } from './afmdb';

const LIMIT = 1000;

/**
 * Bounds the loop below. At `LIMIT` rows a page this allows far more than the real row count,
 * so it only trips if AFMDB stops honouring `skip` and keeps returning the same page.
 */
const MAX_PAGES = 100;

/**
 * Fetches all leaderboard data from AFMDB with pagination.
 * This is a pure async function that can be used both in API routes and getStaticProps.
 */
export async function fetchLeaderboardData(): Promise<ContributeAgent[]> {
  const baseUrl = getAfmdbAttributeValuesUrl('USER');

  let skip = 0;
  let allResults: ContributeAgent[] = [];

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url = `${baseUrl}?skip=${skip}&limit=${LIMIT}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new AfmdbError(`Failed to fetch leaderboard: ${response.status}`, response.status);
    }

    const pageData = await response.json();

    // Anything but an array means the read failed in a way the status code did not report.
    // Concatenating it would push an error body into the table as a row.
    if (!Array.isArray(pageData)) {
      throw new AfmdbError(`Unexpected leaderboard payload at skip=${skip}`, 502);
    }

    if (pageData.length === 0) return allResults;

    allResults = allResults.concat(pageData);

    // Advance by what came back, not by LIMIT, and keep going. A short page used to end the
    // loop, so whenever AFMDB answered with fewer rows than asked for the rest of the
    // leaderboard was dropped silently — no error, just a shorter table.
    skip += pageData.length;
  }

  // Truncating here would look like a working page with contributors missing, so say so instead.
  throw new AfmdbError(`Leaderboard pagination exceeded ${MAX_PAGES} pages`, 502);
}
