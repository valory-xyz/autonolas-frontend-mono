import {
  MechAnalyticsError,
  fetchAllScoredRows,
  iterateScoredRows,
} from 'common-util/mechAnalytics/client';
import type { ScoredRow } from 'common-util/mechAnalytics/types';

const originalFetch = global.fetch;
const originalEnv = process.env;

const REQUESTER = '0x' + '55'.repeat(20);
const CHAIN_ID = 100;

const mockScoredRow = (overrides: Partial<ScoredRow> = {}): ScoredRow => ({
  request_id: 'req-1',
  tool: 'superforcaster',
  mech_address: '0x' + 'aa'.repeat(20),
  requester: REQUESTER,
  chain_id: CHAIN_ID,
  market_id: null,
  question_title: null,
  requested_at: '2026-08-01T00:00:00Z',
  delivered_at: '2026-08-01T00:00:30Z',
  computed_at: '2026-08-01T00:01:00Z',
  source: 'mech_onchain',
  request_ipfs_hash: 'bafy1',
  delivery_ipfs_hash: 'bafy2',
  request_tx_hash: '0x' + 'aa'.repeat(32),
  delivery_tx_hash: '0x' + 'bb'.repeat(32),
  delivery_rate: '10000000000000000',
  ipfs_retrievable: true,
  ...overrides,
});

const mockOk = (body: unknown): Response =>
  ({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => body,
  }) as unknown as Response;

const mockFail = (status: number): Response =>
  ({
    ok: false,
    status,
    statusText: 'Server Error',
    json: async () => ({}),
  }) as unknown as Response;

beforeEach(() => {
  process.env = { ...originalEnv, NEXT_PUBLIC_MECH_ANALYTICS_URL: 'https://ma.example' };
});

afterEach(() => {
  global.fetch = originalFetch;
});

afterAll(() => {
  process.env = originalEnv;
});

describe('iterateScoredRows', () => {
  it('follows next_cursor until null', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        mockOk({ rows: [mockScoredRow({ request_id: 'req-1' })], next_cursor: 'cursor-a' }),
      )
      .mockResolvedValueOnce(
        mockOk({ rows: [mockScoredRow({ request_id: 'req-2' })], next_cursor: null }),
      );

    const collected: ScoredRow[] = [];
    for await (const page of iterateScoredRows({ chainId: CHAIN_ID, requester: REQUESTER })) {
      collected.push(...page);
    }
    expect(collected.map((r) => r.request_id)).toEqual(['req-1', 'req-2']);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect((global.fetch as jest.Mock).mock.calls[1][0]).toContain('cursor=cursor-a');
  });

  it('throws on non-2xx', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(mockFail(500));
    await expect(fetchAllScoredRows({ chainId: CHAIN_ID, requester: REQUESTER })).rejects.toThrow(
      MechAnalyticsError,
    );
  });

  it('caps at maxPages so a broken server does not loop forever', async () => {
    global.fetch = jest.fn().mockResolvedValue(mockOk({ rows: [], next_cursor: 'never-null' }));
    await expect(
      fetchAllScoredRows({ chainId: CHAIN_ID, requester: REQUESTER, maxPages: 3 }),
    ).rejects.toThrow(/max_pages=3/);
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('passes chain_id and requester on the URL', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(mockOk({ rows: [], next_cursor: null }));
    await fetchAllScoredRows({ chainId: 8453, requester: REQUESTER });
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('chain_id=8453');
    expect(url).toContain(`requester=${REQUESTER}`);
  });

  it('passes since= when provided so the ascending scan is window-bounded', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(mockOk({ rows: [], next_cursor: null }));
    const since = '2026-07-31T00:00:00.000Z';
    await fetchAllScoredRows({ chainId: CHAIN_ID, requester: REQUESTER, since });
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('since=');
    expect(decodeURIComponent(url.split('since=')[1].split('&')[0])).toBe(since);
  });

  it('omits since= when not provided', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(mockOk({ rows: [], next_cursor: null }));
    await fetchAllScoredRows({ chainId: CHAIN_ID, requester: REQUESTER });
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).not.toContain('since=');
  });
});
