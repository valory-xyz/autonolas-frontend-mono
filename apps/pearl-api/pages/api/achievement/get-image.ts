import type { NextApiRequest, NextApiResponse } from 'next';

import { setCorsHeaders } from '../../../utils/cors';
import { getLookupEntry } from '../../../utils/blob';
import { parseAchievementApiQueryParams } from '../../../utils';

type ErrorResponse = {
  error: string;
  message?: string;
};

type GetImageResponse = {
  url: string;
  ipfsHash: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetImageResponse | ErrorResponse>,
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

    const entry = await getLookupEntry(params);

    if (!entry) {
      return res.status(404).json({
        error: 'Not Found',
        message: `No image found for agent=${params.agent}, type=${params.type}, id=${params.id}`,
      });
    }

    // Cache the response since images are immutable once generated
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    return res.status(200).json({
      url: entry.ipfsUrl,
      ipfsHash: entry.ipfsHash,
    });
  } catch (error) {
    console.error('Error getting achievement image:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    });
  }
}
