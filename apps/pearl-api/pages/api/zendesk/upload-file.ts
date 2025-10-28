import type { NextApiRequest, NextApiResponse } from 'next';

import { ZENDESK_BASE_URL } from '../../../constants';
import { getZendeskRequestHeaders } from '../../../utils';

const API_URL = `${ZENDESK_BASE_URL}/api/v2/uploads.json`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  try {
    const { fileName, fileData, contentType } = req.body;

    if (!fileName || !fileData || !contentType) {
      return res
        .status(400)
        .json({ error: 'Bad request', message: 'One or more of the required fields is missing' });
    }

    const headers = getZendeskRequestHeaders(contentType);
    const uploadUrl = `${API_URL}?filename=${encodeURIComponent(fileName)}`;
    const fileBuffer = Buffer.from(fileData.split(',')[1], 'base64');
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers,
      body: fileBuffer as unknown as BodyInit,
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to upload file' });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({
      error: 'File upload failed',
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    });
  }
}
