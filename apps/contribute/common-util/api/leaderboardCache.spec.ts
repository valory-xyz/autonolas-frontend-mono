import { fetchLeaderboardData } from './fetchLeaderboardData';
import { readLeaderboardForPrerender, resetLeaderboardCache } from './leaderboardCache';

jest.mock('./fetchLeaderboardData', () => ({ fetchLeaderboardData: jest.fn() }));

const mockFetch = fetchLeaderboardData as jest.MockedFunction<typeof fetchLeaderboardData>;

const rows = [{ attribute_id: 1, json_value: { points: 10 } }] as never;

beforeEach(() => {
  resetLeaderboardCache();
  mockFetch.mockReset();
});

describe('readLeaderboardForPrerender', () => {
  it('collapses concurrent reads into one fetch', async () => {
    // A crawler walking profile URLs regenerates many pages at once, and each needs one wallet
    // out of the same ~6k rows. Without this they would each start their own full read.
    mockFetch.mockResolvedValue(rows);

    const results = await Promise.all([
      readLeaderboardForPrerender(),
      readLeaderboardForPrerender(),
      readLeaderboardForPrerender(),
    ]);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    results.forEach((result) => expect(result).toBe(rows));
  });

  it('reuses the result for sequential reads inside the window', async () => {
    mockFetch.mockResolvedValue(rows);

    await readLeaderboardForPrerender();
    await readLeaderboardForPrerender();

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('refetches once the window has passed', async () => {
    mockFetch.mockResolvedValue(rows);
    const now = jest.spyOn(Date, 'now');

    now.mockReturnValue(0);
    await readLeaderboardForPrerender();

    now.mockReturnValue(61_000);
    await readLeaderboardForPrerender();

    expect(mockFetch).toHaveBeenCalledTimes(2);
    now.mockRestore();
  });

  it('does not pin later callers to a failed read', async () => {
    mockFetch.mockRejectedValueOnce(new Error('AFMDB down'));
    await expect(readLeaderboardForPrerender()).rejects.toThrow('AFMDB down');

    mockFetch.mockResolvedValueOnce(rows);
    await expect(readLeaderboardForPrerender()).resolves.toBe(rows);

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
