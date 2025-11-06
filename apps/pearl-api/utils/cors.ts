import type { NextApiRequest, NextApiResponse } from 'next';

const isLocalhostOrigin = (origin: string | undefined): boolean => {
  if (!origin) return false;
  return origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
};

export const setCorsHeaders = (req: NextApiRequest, res: NextApiResponse): void => {
  const origin = req.headers.origin;
  const isLocalhost = isLocalhostOrigin(origin);

  if (isLocalhost && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
};
