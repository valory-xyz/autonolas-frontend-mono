import { getAchievementData } from './achievementData';

const mockGetOmenBet = jest.fn();
const mockGetPolymarketBet = jest.fn();
jest.mock('./omenstrat', () => ({ getOmenBet: (...args: unknown[]) => mockGetOmenBet(...args) }));
jest.mock('./polystrat', () => ({
  getPolymarketBet: (...args: unknown[]) => mockGetPolymarketBet(...args),
}));

describe('getAchievementData', () => {
  beforeEach(() => {
    mockGetOmenBet.mockReset().mockResolvedValue('omen');
    mockGetPolymarketBet.mockReset().mockResolvedValue('polymarket');
  });

  it('routes omenstrat payouts to the Omen fetcher', async () => {
    await expect(
      getAchievementData({ agent: 'omenstrat', type: 'payout', id: 'bet' }),
    ).resolves.toBe('omen');
    expect(mockGetOmenBet).toHaveBeenCalledWith('bet');
    expect(mockGetPolymarketBet).not.toHaveBeenCalled();
  });

  it('routes polystrat payouts to the Polymarket fetcher', async () => {
    await expect(
      getAchievementData({ agent: 'polystrat', type: 'payout', id: 'bet' }),
    ).resolves.toBe('polymarket');
    expect(mockGetPolymarketBet).toHaveBeenCalledWith('bet');
    expect(mockGetOmenBet).not.toHaveBeenCalled();
  });

  it('returns null for an agent without cards', async () => {
    await expect(
      getAchievementData({ agent: 'optimus', type: 'payout', id: 'bet' }),
    ).resolves.toBeNull();
  });
});
