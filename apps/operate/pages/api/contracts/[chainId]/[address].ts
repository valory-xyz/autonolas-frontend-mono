import type { NextApiRequest, NextApiResponse } from 'next';

import { isValidAddress } from 'libs/util-functions/src';

import { fetchContractCacheDataFromChain } from 'common-util/fetch-contract-cache-data';
import { getContractCache, setContractCache } from 'common-util/blob';

/** Chain IDs we allow for contract cache (have RPC and are used for staking). */
const ALLOWED_CHAIN_IDS = new Set([1, 10, 100, 137, 8453, 34443]);

/**
 * GET: Returns cached contract data. On cache miss, performs read-through (RPC + IPFS + blob write).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { chainId, address } = req.query;

  const chainIdNum = typeof chainId === 'string' && /^\d+$/.test(chainId) ? Number(chainId) : null;
  const addressStr = typeof address === 'string' && address.length > 0 ? address.trim() : null;

  if (chainIdNum == null || addressStr == null) {
    return res.status(400).json({ error: 'Missing or invalid chainId or address' });
  }

  if (!isValidAddress(addressStr)) {
    return res.status(400).json({ error: 'Invalid address format' });
  }

  if (!ALLOWED_CHAIN_IDS.has(chainIdNum)) {
    return res.status(400).json({ error: 'Chain not allowed' });
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
