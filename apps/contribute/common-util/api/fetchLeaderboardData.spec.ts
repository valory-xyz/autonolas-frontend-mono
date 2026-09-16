import { fetchLeaderboardData } from './fetchLeaderboardData';

const BASE_URL = 'https://afmdb.test/api/agent-types/14/attributes/8/values';

jest.mock('./afmdb', () => ({
  ...jest.requireActual('./afmdb'),
  getAfmdbAttributeValuesUrl: () => 'https://afmdb.test/api/agent-types/14/attributes/8/values',
}));

const row = (id: number) => ({ attribute_id: id, json_value: { points: id } });

/** Answers each call with the next page, so a test describes AFMDB by listing what it returns. */
const mockPages = (pages: unknown[][]) => {
  const fetchMock = jest.fn();
  pages.forEach((page) => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => page });
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe('fetchLeaderboardData', () => {
  it('keeps paging past a short page instead of truncating the leaderboard', async () => {
    // AFMDB answering with fewer rows than asked for used to end the loop, so every row after
    // the short page was dropped silently and the table just came back smaller.
    const shortPage = Array.from({ length: 900 }, (_, i) => row(i));
    const nextPage = Array.from({ length: 300 }, (_, i) => row(900 + i));
    mockPages([shortPage, nextPage, []]);

    const result = await fetchLeaderboardData();

    expect(result).toHaveLength(1200);
  });

  it('advances skip by the rows received, so a short page does not skip rows', async () => {
    const fetchMock = mockPages([Array.from({ length: 900 }, (_, i) => row(i)), []]);

    await fetchLeaderboardData();

    expect(fetchMock.mock.calls[0][0]).toBe(`${BASE_URL}?skip=0&limit=1000`);
    expect(fetchMock.mock.calls[1][0]).toBe(`${BASE_URL}?skip=900&limit=1000`);
  });

  it('stops on an empty page', async () => {
    const fetchMock = mockPages([Array.from({ length: 1000 }, (_, i) => row(i)), []]);

    const result = await fetchLeaderboardData();

    expect(result).toHaveLength(1000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws rather than returning an error body as rows', async () => {
    mockPages([{ detail: 'boom' } as unknown as unknown[]]);

    await expect(fetchLeaderboardData()).rejects.toThrow('Unexpected leaderboard payload');
  });

  it('forwards a non-2xx status', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 503 }) as unknown as typeof fetch;

    await expect(fetchLeaderboardData()).rejects.toThrow('Failed to fetch leaderboard: 503');
  });
});
