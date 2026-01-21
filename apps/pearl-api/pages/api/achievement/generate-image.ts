import type { NextApiRequest, NextApiResponse } from 'next';

import { setCorsHeaders } from '../../../utils/cors';
import { uploadImageToIpfs } from '../../../utils/ipfs';
import { getLookupEntry, setLookupEntry } from '../../../utils/blob';
import {
  generateAchievementImage,
  imageResponseToBuffer,
} from '../../../components/og/AchievementImage';
import { parseAchievementApiQueryParams } from '../../../utils';

type GenerateImageResponse = {
  url: string;
  ipfsHash: string;
};

type ErrorResponse = {
  error: string;
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenerateImageResponse | ErrorResponse>,
) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
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

    const existingEntry = await getLookupEntry(params);

    if (existingEntry) {
      return res.status(200).json({
        url: existingEntry.ipfsUrl,
        ipfsHash: existingEntry.ipfsHash,
      });
    }

    const imageResponse = await generateAchievementImage(params);
    const imageBuffer = await imageResponseToBuffer(imageResponse);
    const { hash, url } = await uploadImageToIpfs(imageBuffer);

    await setLookupEntry(params, {
      ipfsHash: hash,
      ipfsUrl: url,
      createdAt: Date.now(),
    });

    return res.status(201).json({
      url,
      ipfsHash: hash,
    });
  } catch (error) {
    console.error('Error generating achievement image:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
