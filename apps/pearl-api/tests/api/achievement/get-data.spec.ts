/**
 * @jest-environment node
 */
import type { NextApiRequest, NextApiResponse } from 'next';

import handler from '../../../pages/api/achievement/get-data';

const mockGetAchievementData = jest.fn();
jest.mock('../../../utils/achievementData', () => ({
  getAchievementData: (...args: unknown[]) => mockGetAchievementData(...args),
}));

const BET_ID = `0x${'a'.repeat(64)}01000000`;

const DATA = {
  question: 'Does Google have the best AI model end of January?',
  position: 'Yes',
  transactionHash: `0x${'a'.repeat(64)}`,
  betAmount: 1,
  amountWon: 2.4,
  betAmountFormatted: '$1.00',
  amountWonFormatted: '$2.40',
  multiplier: '2.40',
  marketImageUrl: null,
};

const createRes = () => {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    headers: {} as Record<string, string>,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(body: unknown) {
      res.body = body;
      return res;
    },
    end() {
      return res;
    },
    setHeader(name: string, value: string) {
      res.headers[name] = value;
      return res;
    },
  };
  return res;
};

const call = async (query: Record<string, string>, method = 'GET') => {
  const res = createRes();
  await handler(
    { method, query, headers: {} } as unknown as NextApiRequest,
    res as unknown as NextApiResponse,
  );
  return res;
};

describe('GET /api/achievement/get-data', () => {
  beforeEach(() => {
    mockGetAchievementData.mockReset();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('returns the figures of a settled win with a long edge cache', async () => {
    mockGetAchievementData.mockResolvedValue(DATA);

    const res = await call({ agent: 'omenstrat', type: 'payout', id: BET_ID });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(DATA);
    expect(res.headers['Cache-Control']).toBe('public, s-maxage=86400');
    expect(mockGetAchievementData).toHaveBeenCalledWith({
      agent: 'omenstrat',
      type: 'payout',
      id: BET_ID,
    });
  });

  it('answers 404 without caching when the bet is not a settled win', async () => {
    mockGetAchievementData.mockResolvedValue(null);

    const res = await call({ agent: 'omenstrat', type: 'payout', id: BET_ID });

    expect(res.statusCode).toBe(404);
    expect(res.headers['Cache-Control']).toBeUndefined();
  });

  it('answers 400 for invalid params without fetching', async () => {
    const res = await call({ agent: 'omenstrat', type: 'payout', id: 'a/b' });

    expect(res.statusCode).toBe(400);
    expect(mockGetAchievementData).not.toHaveBeenCalled();
  });

  it('answers 500 when the upstream fetch fails', async () => {
    mockGetAchievementData.mockRejectedValue(new Error('subgraph down'));

    const res = await call({ agent: 'omenstrat', type: 'payout', id: BET_ID });

    expect(res.statusCode).toBe(500);
    expect(res.headers['Cache-Control']).toBeUndefined();
  });

  it('logs raw query values as arguments, not inside the format string', async () => {
    const error = new Error('subgraph down');
    mockGetAchievementData.mockRejectedValue(error);

    await call({ agent: 'omenstrat', type: 'payout', id: BET_ID });

    expect(console.error).toHaveBeenCalledWith(
      'Error getting achievement data for agent=%s, type=%s, id=%s:',
      'omenstrat',
      'payout',
      BET_ID,
      error,
    );
  });

  it('rejects non-GET methods', async () => {
    const res = await call({ agent: 'omenstrat', type: 'payout', id: BET_ID }, 'POST');

    expect(res.statusCode).toBe(405);
  });
});
