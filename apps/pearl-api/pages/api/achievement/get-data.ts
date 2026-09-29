import type { NextApiRequest, NextApiResponse } from 'next';

import type { AchievementData } from 'types/achievement';
import { setCorsHeaders } from 'utils/cors';
import { getAchievementData } from 'utils/achievementData';
import { parseAchievementApiQueryParams } from 'utils/api';

type ErrorResponse = {
  error: string;
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AchievementData | ErrorResponse>,
) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET, OPTIONS');
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const params = parseAchievementApiQueryParams(req.query);

    if (!params) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing or invalid query parameters. Required: agent, type, id',
      });
    }

    const data = await getAchievementData(params);

    if (!data) {
      return res.status(404).json({
        error: 'Not Found',
        message: `No settled win found for agent=${params.agent}, type=${params.type}, id=${params.id}`,
      });
    }

    // Figures of a settled win are final.
    res.setHeader('Cache-Control', 'public, s-maxage=86400');

    return res.status(200).json(data);
  } catch (error) {
    const { agent, type, id } = req.query;
    console.error(
      `Error getting achievement data for agent=${agent}, type=${type}, id=${id}:`,
      error,
    );
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    });
  }
}
