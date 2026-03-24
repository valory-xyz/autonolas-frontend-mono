import { ContributeAgent } from 'types/users';

const LIMIT = 1000;

/**
 * Fetches all leaderboard data from AFMDB with pagination.
 * This is a pure async function that can be used both in API routes and getServerSideProps.
 */
export async function fetchLeaderboardData(): Promise<ContributeAgent[]> {
  const afmdbUrl = process.env.NEXT_PUBLIC_AFMDB_URL;
  const agentTypeId = process.env.AGENT_TYPE_ID;
  const attributeIdMappingRaw = process.env.ATTRIBUTE_ID_MAPPING;

  if (!afmdbUrl || !agentTypeId || !attributeIdMappingRaw) {
    throw new Error(
      'Missing required environment variables for leaderboard fetch. ' +
        'Ensure NEXT_PUBLIC_AFMDB_URL, AGENT_TYPE_ID, and ATTRIBUTE_ID_MAPPING are set.',
    );
  }

  let attributeTypeId: string;
  try {
    const parsedMapping = JSON.parse(attributeIdMappingRaw) as Record<string, string>;
    if (typeof parsedMapping.USER !== 'string') {
      throw new Error('ATTRIBUTE_ID_MAPPING.USER must be a string');
    }
    attributeTypeId = parsedMapping.USER;
  } catch (error) {
    throw new Error('Invalid ATTRIBUTE_ID_MAPPING environment variable');
  }

  const baseUrl = `${afmdbUrl}/api/agent-types/${agentTypeId}/attributes/${attributeTypeId}/values`;

  let skip = 0;
  let allResults: ContributeAgent[] = [];

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const url = `${baseUrl}?skip=${skip}&limit=${LIMIT}`;
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
