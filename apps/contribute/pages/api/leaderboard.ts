import type { NextApiRequest, NextApiResponse } from 'next';

import { ContributeAgent } from 'types/users';

// TODO: Update this once we point to prod.
const AGENT_TYPE = 1;
const ATTRIBUTE_TYPE_ID = 2;

const LIMIT = 1000;

const BASE_URL = `${process.env.NEXT_PUBLIC_AFMDB_URL}/api/agent-types/${AGENT_TYPE}/attributes/${ATTRIBUTE_TYPE_ID}/values`;
const ERROR_MESSAGE = 'Failed to fetch leaderboard.';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  let skip = 0;
  let allResults: ContributeAgent[] = [];

  try {
    // Request all the users by pages
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const url = `${BASE_URL}?skip=${skip}&limit=${LIMIT}`;
      const response = await fetch(url);

      if (!response.ok) {
        return res.status(response.status).json({ error: ERROR_MESSAGE });
      }

      const pageData = await response.json();

      // If the returned page is empty, or the amount of items is less
      // than the limit, we're on the last page
      if (!Array.isArray(pageData) || pageData.length === 0 || pageData.length < LIMIT) {
        break;
      }

      allResults = allResults.concat(pageData);
      skip += LIMIT;
    }

    res.status(200).json(allResults);
  } catch (error) {
    res.status(500).json({ error: ERROR_MESSAGE, details: error });
  }
}
