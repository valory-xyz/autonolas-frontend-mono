import { ContributeAgent } from 'types/users';

const AGENT_TYPE = process.env.AGENT_TYPE_ID;
const ATTRIBUTE_TYPE_ID = JSON.parse(process.env.ATTRIBUTE_ID_MAPPING!)['USER'];

const LIMIT = 1000;

const BASE_URL = `${process.env.NEXT_PUBLIC_AFMDB_URL}/api/agent-types/${AGENT_TYPE}/attributes/${ATTRIBUTE_TYPE_ID}/values`;

/**
 * Fetches all leaderboard data from AFMDB with pagination.
 * This is a pure async function that can be used both in API routes and getServerSideProps.
 */
export async function fetchLeaderboardData(): Promise<ContributeAgent[]> {
  let skip = 0;
  let allResults: ContributeAgent[] = [];

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const url = `${BASE_URL}?skip=${skip}&limit=${LIMIT}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch leaderboard: ${response.status}`);
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
