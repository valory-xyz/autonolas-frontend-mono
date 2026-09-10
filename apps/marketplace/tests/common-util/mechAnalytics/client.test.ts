import {
  MechAnalyticsError,
  iterateScoredRows,
  type ScoredRowPage,
} from 'common-util/mechAnalytics/client';
import { MECH_ANALYTICS_URL } from 'common-util/mechAnalytics/config';
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
  delivery_mech: '0x' + 'cc'.repeat(20),
  payment_type: 'native',
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

const drain = async (iter: AsyncGenerator<ScoredRowPage>) => {
  const rows: ScoredRow[] = [];
  for await (const page of iter) rows.push(...page.rows);
  return rows;
};

beforeEach(() => {
  process.env = { ...originalEnv };
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

    const collected = await drain(iterateScoredRows({ chainId: CHAIN_ID, requester: REQUESTER }));
    expect(collected.map((r) => r.request_id)).toEqual(['req-1', 'req-2']);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect((global.fetch as jest.Mock).mock.calls[1][0]).toContain('cursor=cursor-a');
  });

  it('throws on non-2xx', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(mockFail(500));
    await expect(
      drain(iterateScoredRows({ chainId: CHAIN_ID, requester: REQUESTER })),
    ).rejects.toThrow(MechAnalyticsError);
  });

  it('passes chain_id and requester on the URL', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(mockOk({ rows: [], next_cursor: null }));
    await drain(iterateScoredRows({ chainId: 8453, requester: REQUESTER }));
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('chain_id=8453');
    expect(url).toContain(`requester=${REQUESTER}`);
  });

  it('calls the built-in API URL even when a stale env URL is set', async () => {
    // The URL is deliberately not configurable; a leftover env var from the
    // old setup must not redirect requests.
    process.env.NEXT_PUBLIC_MECH_ANALYTICS_URL = 'https://stale.example';
    global.fetch = jest.fn().mockResolvedValueOnce(mockOk({ rows: [], next_cursor: null }));
    await drain(iterateScoredRows({ chainId: CHAIN_ID, requester: REQUESTER }));
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url.startsWith(`${MECH_ANALYTICS_URL}/v1/data/scored-rows?`)).toBe(true);
    expect(url).not.toContain('stale.example');
  });

  it('passes sort_direction=desc when requested', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(mockOk({ rows: [], next_cursor: null }));
    await drain(
      iterateScoredRows({ chainId: CHAIN_ID, requester: REQUESTER, sortDirection: 'desc' }),
    );
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('sort_direction=desc');
  });

  it('passes delivery_mech filter when set (Supply query)', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(mockOk({ rows: [], next_cursor: null }));
    const mech = '0x' + 'de'.repeat(20);
    await drain(iterateScoredRows({ chainId: CHAIN_ID, deliveryMech: mech }));
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain(`delivery_mech=${mech}`);
    // And it's distinct from mech_address (priority mech).
    expect(url).not.toContain('mech_address=');
  });

  it('passes sort=requested_at when requested', async () => {
    // The activity feed uses this to sort by actual per-row request
    // time, not by mech-analytics' computed_at (which degenerates
    // on backfill-heavy mechs where every ipfs_historical row
    // shares one computed_at and DESC falls to request_id
    // tiebreak). Available on mech-analytics since PR#40.
    global.fetch = jest.fn().mockResolvedValueOnce(mockOk({ rows: [], next_cursor: null }));
    await drain(
      iterateScoredRows({
        chainId: CHAIN_ID,
        requester: REQUESTER,
        sortDirection: 'desc',
        sort: 'requested_at',
      }),
    );
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('sort=requested_at');
    expect(url).toContain('sort_direction=desc');
  });

  it('omits filters that were not passed', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(mockOk({ rows: [], next_cursor: null }));
    await drain(iterateScoredRows({ chainId: CHAIN_ID, requester: REQUESTER }));
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).not.toContain('delivery_mech=');
    expect(url).not.toContain('sort_direction=');
    expect(url).not.toContain('sort=');
    expect(url).not.toContain('mech_address=');
  });

  it('yields each page with its own nextCursor so a bounded caller can distinguish exhaustion from truncation', async () => {
    // Page 1 has a cursor (more upstream); page 2 is the tail.
    // fetchCapped in service-activity.ts reads page.nextCursor at
    // the cap boundary to avoid a spurious hasMore=true.
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        mockOk({ rows: [mockScoredRow({ request_id: 'a' })], next_cursor: 'cursor-1' }),
      )
      .mockResolvedValueOnce(
        mockOk({ rows: [mockScoredRow({ request_id: 'b' })], next_cursor: null }),
      );
    const pages: ScoredRowPage[] = [];
    for await (const page of iterateScoredRows({ chainId: CHAIN_ID, requester: REQUESTER })) {
      pages.push(page);
    }
    expect(pages).toHaveLength(2);
    expect(pages[0].nextCursor).toBe('cursor-1');
    expect(pages[1].nextCursor).toBeNull();
  });
});
