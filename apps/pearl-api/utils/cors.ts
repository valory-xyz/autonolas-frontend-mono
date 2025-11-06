import type { NextApiRequest, NextApiResponse } from 'next';

export const isLocalhostOrigin = (origin: string | undefined): boolean => {
  if (!origin) return false;
  return origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1');
};

export const setCorsHeaders = (req: NextApiRequest, res: NextApiResponse): void => {
  const origin = req.headers.origin;
  const isLocalhost = isLocalhostOrigin(origin);

  if (isLocalhost) {
    res.setHeader('Access-Control-Allow-Origin', origin!);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};
