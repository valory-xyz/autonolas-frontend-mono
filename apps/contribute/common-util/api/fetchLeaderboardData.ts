import { ContributeAgent } from 'types/users';

import { AfmdbError, getAfmdbAttributeValuesUrl } from './afmdb';

const LIMIT = 1000;

/**
 * Fetches all leaderboard data from AFMDB with pagination.
 * This is a pure async function that can be used both in API routes and getServerSideProps.
 */
export async function fetchLeaderboardData(): Promise<ContributeAgent[]> {
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
  }

  return allResults;
}
