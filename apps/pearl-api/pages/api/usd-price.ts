import type { NextApiRequest, NextApiResponse } from 'next';

import {
  COINGECKO_COIN_ID_BY_NATIVE_SYMBOL,
  COINGECKO_PLATFORM_BY_CHAIN_NAME,
} from '../../constants/coingecko';
import { CACHE_DURATION } from '../../constants';

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;

const getRequestOptions = () => {
  const headers: Record<string, string> = { accept: 'application/json' };
  if (COINGECKO_API_KEY) headers['x-cg-demo-api-key'] = COINGECKO_API_KEY;
  return { method: 'GET', headers };
};

const extractErrorMessage = (error: unknown) =>
  typeof error === 'object' && error && 'message' in error
    ? String((error as { message?: string }).message)
    : 'Unknown error';

const fetchTokenPriceInUSD = async ({
  platform,
  address,
}: {
  platform?: string;
  address?: string;
}) => {
  if (!platform || !address) {
    return { error: 'platform and address are required' };
  }

  try {
    const params = new URLSearchParams({
      contract_addresses: address,
      vs_currencies: 'usd',
    });
    const coingeckoPlatform = COINGECKO_PLATFORM_BY_CHAIN_NAME[platform];
    const requestUrl = `${COINGECKO_API_BASE}/simple/token_price/${coingeckoPlatform}?${params.toString()}`;
    const response = await fetch(requestUrl, getRequestOptions());
    if (!response.ok) {
      return { error: `Upstream error ${response.status}` };
    }

    const data = await response.json();
    const addressKey = address.toLowerCase();
    const price: number = typeof data?.[addressKey]?.usd === 'number' ? data[addressKey].usd : 0;
    return { price };
  } catch (error: unknown) {
    return {
      error: extractErrorMessage(error),
    };
  }
};

const fetchCoinPriceInUSD = async (coinId?: string) => {
  if (!coinId) {
    return { error: 'coinId is required' };
  }

  try {
    const coingeckoCoinId = COINGECKO_COIN_ID_BY_NATIVE_SYMBOL[coinId];
    const params = new URLSearchParams({ ids: coingeckoCoinId, vs_currencies: 'usd' });
    const requestUrl = `${COINGECKO_API_BASE}/simple/price?${params.toString()}`;
    const response = await fetch(requestUrl, getRequestOptions());
    if (!response.ok) {
      return { error: `Upstream error ${response.status}` };
    }

    const data = await response.json();
    const price: number =
      typeof data?.[coingeckoCoinId]?.usd === 'number' ? data[coingeckoCoinId].usd : 0;
    return { price };
  } catch (error) {
    return { error: extractErrorMessage(error) };
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Vercel's cache
  res.setHeader(
    'Cache-Control',
    `public, s-maxage=${CACHE_DURATION.TWELVE_HOURS}, stale-while-revalidate=${CACHE_DURATION.ONE_HOUR}`,
  );

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { platform, address, coinId } = req.query as {
    platform?: string;
    address?: string;
    coinId?: string;
  };

  if (!platform && !coinId) {
    return res.status(400).json({ error: 'platform or coinId is required' });
  }

  const { price, error } = coinId
    ? await fetchCoinPriceInUSD(coinId)
    : await fetchTokenPriceInUSD({ platform, address });

  if (error) {
    return res.status(500).json({ error });
  }

  return res.status(200).json({ price });
}
