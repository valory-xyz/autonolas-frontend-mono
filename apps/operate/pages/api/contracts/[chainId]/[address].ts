import type { NextApiRequest, NextApiResponse } from 'next';

import { getContractCache, setContractCache } from 'common-util/blob';
import type { ContractCacheData } from 'types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { chainId, address } = req.query;

  const chainIdNum = typeof chainId === 'string' && /^\d+$/.test(chainId) ? Number(chainId) : null;
  const addressStr = typeof address === 'string' && address.length > 0 ? address : null;

  if (chainIdNum == null || addressStr == null) {
    return res.status(400).json({ error: 'Missing or invalid chainId or address' });
  }

  if (req.method === 'GET') {
    try {
      const snapshot = await getContractCache(chainIdNum, addressStr);
      if (!snapshot) {
        return res.status(404).json({ error: 'Cache miss' });
      }
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.status(200).json(snapshot);
    } catch (error) {
      console.error('Contract cache read error:', error);
      return res.status(500).json({ error: 'Failed to read cache' });
    }
  }

  if (req.method === 'PUT') {
    const body = req.body as unknown;
    if (
      !body ||
      typeof body !== 'object' ||
      !('config' in body) ||
      !('metadata' in body) ||
      !('operateDetails' in body)
    ) {
      return res
        .status(400)
        .json({ error: 'Invalid payload: need config, metadata, operateDetails' });
    }
    try {
      await setContractCache(chainIdNum, addressStr, body as ContractCacheData);
      return res.status(204).end();
    } catch (error) {
      console.error('Contract cache write error:', error);
      return res.status(500).json({ error: 'Failed to write cache' });
    }
  }

  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).end();
}
