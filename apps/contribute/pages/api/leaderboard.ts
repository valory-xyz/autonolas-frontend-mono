import type { NextApiRequest, NextApiResponse } from 'next';

import { fetchLeaderboardData } from 'common-util/api/fetchLeaderboardData';

const ERROR_MESSAGE = 'Failed to fetch leaderboard.';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const allResults = await fetchLeaderboardData();
    res.status(200).json(allResults);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: ERROR_MESSAGE, details: error });
  }
}
