import type { NextApiRequest, NextApiResponse } from 'next';

import { fetchContractCacheDataFromChain } from 'common-util/fetch-contract-cache-data';
import { getContractCache, setContractCache } from 'common-util/blob';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { chainId, address } = req.query;

  const chainIdNum = typeof chainId === 'string' && /^\d+$/.test(chainId) ? Number(chainId) : null;
  const addressStr = typeof address === 'string' && address.length > 0 ? address : null;

  if (chainIdNum === null || addressStr === null) {
    return res.status(400).json({ error: 'Missing or invalid chainId or address' });
  }

  if (req.method === 'GET') {
    try {
      let snapshot = await getContractCache(chainIdNum, addressStr);
      if (!snapshot) {
        const data = await fetchContractCacheDataFromChain(chainIdNum, addressStr);
        if (!data) {
          return res.status(404).json({ error: 'Not a staking contract or fetch failed' });
        }
        await setContractCache(chainIdNum, addressStr, data);
        snapshot = { data, timestamp: Date.now() };
      }
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.status(200).json(snapshot);
    } catch (error) {
      console.error('Contract cache read error:', error);
      return res.status(500).json({ error: 'Failed to read cache' });
    }
  }

  res.setHeader('Allow', 'GET');
  return res.status(405).end();
}
