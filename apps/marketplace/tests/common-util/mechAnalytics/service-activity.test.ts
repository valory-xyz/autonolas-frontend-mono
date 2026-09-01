import type { Activity } from 'common-util/graphql/service-activity';
import { getServiceActivityFromMechAnalytics } from 'common-util/mechAnalytics/service-activity';
import type { ScoredRow } from 'common-util/mechAnalytics/types';

jest.mock('common-util/mechAnalytics/client', () => {
  const iter = (rows: ScoredRow[]) =>
    (async function* () {
      yield rows;
    })();
  return {
    iterateScoredRows: jest.fn(() => iter([])),
    iterateUnscoredRows: jest.fn(() => iter([])),
  };
});

const { iterateScoredRows, iterateUnscoredRows } = jest.requireMock(
  'common-util/mechAnalytics/client',
) as {
  iterateScoredRows: jest.Mock;
  iterateUnscoredRows: jest.Mock;
};

const scoredRowIter = (rows: ScoredRow[]) =>
  (async function* () {
    yield rows;
  })();

const scoredRowPaginator = (pages: ScoredRow[][], hasMore = false) =>
  async function* () {
    for (const page of pages) {
      yield page;
    }
    if (hasMore) {
      // Never yield next_cursor=null so the app-level ACTIVITY_MAX_PAGES
      // guard trips at 5 pages.
      for (let i = 0; i < 100; i += 1) {
        yield pages[pages.length - 1] ?? [];
      }
    }
  };

const REQUESTER = '0x' + '55'.repeat(20);
const MECH_MIXED = '0x' + 'Aa'.repeat(20);
const MECH_LOWER = MECH_MIXED.toLowerCase();
const DELIVERY_MECH = '0x' + 'cd'.repeat(20);
const PADDED_REQUEST_ID = `0x${'0'.repeat(62)}42`;
const TRIMMED_REQUEST_ID = '0x42';

const scoredRow = (overrides: Partial<ScoredRow> = {}): ScoredRow => ({
  request_id: PADDED_REQUEST_ID,
  tool: 'superforcaster',
  mech_address: MECH_LOWER,
  requester: REQUESTER,
  chain_id: 100,
  market_id: null,
  question_title: null,
  requested_at: '2026-08-30T00:00:00Z',
  delivered_at: '2026-08-30T00:00:30Z',
  computed_at: '2026-08-30T00:01:00Z',
  source: 'mech_onchain',
  request_ipfs_hash: 'bafy-request',
  delivery_ipfs_hash: 'bafy-delivery',
  request_tx_hash: '0x' + 'aa'.repeat(32),
  delivery_tx_hash: '0x' + 'bb'.repeat(32),
  delivery_rate: '10000000000000000',
  delivery_mech: DELIVERY_MECH,
  payment_type: 'native',
  ipfs_retrievable: true,
  ...overrides,
});

const subgraphActivity = (overrides: Partial<Activity> = {}): Activity => ({
  activityType: 'Demand',
  requestId: TRIMMED_REQUEST_ID,
  requestIpfsHash: '',
  requestBlockTimestamp: '1',
  requestedBy: REQUESTER,
  requestTransactionHash: '',
  deliveryIpfsHash: '',
  deliveredBy: '0x' + 'cc'.repeat(20),
  deliveryTransactionHash: '',
  deliveryBlockTimestamp: '2',
  payment: '25000000000000000',
  feeUnit: 'NATIVE',
  feeRaw: '25000000000000000',
  feeUSD: '12.34',
  finalFeeUSD: '12.34',
  ...overrides,
});

beforeEach(() => {
  iterateScoredRows.mockReset();
  iterateUnscoredRows.mockReset();
  iterateScoredRows.mockImplementation(() => scoredRowIter([]));
  iterateUnscoredRows.mockImplementation(() => scoredRowIter([]));
});

describe('getServiceActivityFromMechAnalytics — column-level projection', () => {
  it('populates deliveredBy from row.delivery_mech (mech-analytics is authoritative)', async () => {
    iterateScoredRows.mockImplementation((params: { requester?: string; deliveryMech?: string }) =>
      params.requester ? scoredRowIter([scoredRow()]) : scoredRowIter([]),
    );

    const result = await getServiceActivityFromMechAnalytics({
      chainId: 100,
      serviceId: '1',
      multisigs: [REQUESTER],
      mechAddresses: [],
      subgraphActivities: [],
    });

    expect(result.activities).toHaveLength(1);
    expect(result.activities[0].deliveredBy).toBe(DELIVERY_MECH);
  });

  it('maps payment_type=usdc to feeUnit=USDC + finalFeeUSD from micro-USDC', async () => {
    iterateScoredRows.mockImplementation(() =>
      scoredRowIter([scoredRow({ payment_type: 'usdc', delivery_rate: '1234567' })]),
    );

    const result = await getServiceActivityFromMechAnalytics({
      chainId: 100,
      serviceId: '1',
      multisigs: [REQUESTER],
      mechAddresses: [],
      subgraphActivities: [],
    });

    const activity = result.activities[0];
    expect(activity.feeUnit).toBe('USDC');
    // 1,234,567 micro-USDC = $1.23 (toFixed(2) rounds down).
    expect(activity.finalFeeUSD).toBe('1.23');
    expect(activity.feeRaw).toBe('1234567');
  });

  it('maps payment_type=native to feeUnit=NATIVE (raw wei)', async () => {
    iterateScoredRows.mockImplementation(() =>
      scoredRowIter([scoredRow({ payment_type: 'native', delivery_rate: '10000000000000000' })]),
    );

    const result = await getServiceActivityFromMechAnalytics({
      chainId: 100,
      serviceId: '1',
      multisigs: [REQUESTER],
      mechAddresses: [],
      subgraphActivities: [],
    });

    expect(result.activities[0].feeUnit).toBe('NATIVE');
    expect(result.activities[0].feeRaw).toBe('10000000000000000');
    expect(result.activities[0].finalFeeUSD).toBeNull();
  });

  it('unknown payment_type leaves fee fields empty (no mislabel)', async () => {
    iterateScoredRows.mockImplementation(() =>
      scoredRowIter([scoredRow({ payment_type: 'unknown_future_token', delivery_rate: '42' })]),
    );

    const result = await getServiceActivityFromMechAnalytics({
      chainId: 100,
      serviceId: '1',
      multisigs: [REQUESTER],
      mechAddresses: [],
      subgraphActivities: [],
    });

    expect(result.activities[0].feeUnit).toBeNull();
    expect(result.activities[0].feeRaw).toBeNull();
    expect(result.activities[0].finalFeeUSD).toBeNull();
  });

  it('merges feeUSD / finalFeeUSD from subgraph twin when mech-analytics leaves them null', async () => {
    // Request-id encoding differs across sources; the canonicaliser
    // must find the twin regardless of leading-zero trimming.
    iterateScoredRows.mockImplementation((params: { requester?: string }) =>
      params.requester ? scoredRowIter([scoredRow({ payment_type: 'native' })]) : scoredRowIter([]),
    );

    const twin = subgraphActivity({
      requestId: TRIMMED_REQUEST_ID,
      feeUSD: '9.99',
      finalFeeUSD: '9.99',
    });
    const result = await getServiceActivityFromMechAnalytics({
      chainId: 100,
      serviceId: '1',
      multisigs: [REQUESTER],
      mechAddresses: [],
      subgraphActivities: [twin],
    });

    expect(result.activities[0].feeUSD).toBe('9.99');
    expect(result.activities[0].finalFeeUSD).toBe('9.99');
  });
});

describe('getServiceActivityFromMechAnalytics — Supply fan-out uses ?delivery_mech=', () => {
  it('supply query filters on delivery_mech, not mech_address', async () => {
    iterateScoredRows.mockImplementation(() => scoredRowIter([]));
    await getServiceActivityFromMechAnalytics({
      chainId: 100,
      serviceId: '1',
      multisigs: [],
      mechAddresses: [MECH_LOWER],
      subgraphActivities: [],
    });

    // Three fan-outs: two demand (requester) that get [], one supply
    // (deliveryMech). Assert the supply call used deliveryMech.
    const supplyCall = iterateScoredRows.mock.calls.find(
      (c) => (c[0] as { deliveryMech?: string }).deliveryMech,
    );
    expect(supplyCall).toBeDefined();
    expect(
      (supplyCall![0] as { deliveryMech?: string; mechAddress?: string }).mechAddress,
    ).toBeUndefined();
    expect((supplyCall![0] as { deliveryMech?: string }).deliveryMech).toBe(MECH_LOWER);
  });

  it('passes sort_direction=desc on every fan-out shard so page 1 is newest', async () => {
    iterateScoredRows.mockImplementation(() => scoredRowIter([]));
    iterateUnscoredRows.mockImplementation(() => scoredRowIter([]));

    await getServiceActivityFromMechAnalytics({
      chainId: 100,
      serviceId: '1',
      multisigs: [REQUESTER],
      mechAddresses: [MECH_LOWER],
      subgraphActivities: [],
    });

    for (const call of iterateScoredRows.mock.calls) {
      expect((call[0] as { sortDirection?: string }).sortDirection).toBe('desc');
    }
    for (const call of iterateUnscoredRows.mock.calls) {
      expect((call[0] as { sortDirection?: string }).sortDirection).toBe('desc');
    }
  });

  it('does not pass a since= window (mech-analytics leads newest via desc)', async () => {
    iterateScoredRows.mockImplementation(() => scoredRowIter([]));
    await getServiceActivityFromMechAnalytics({
      chainId: 100,
      serviceId: '1',
      multisigs: [REQUESTER],
      mechAddresses: [],
      subgraphActivities: [],
    });
    for (const call of iterateScoredRows.mock.calls) {
      expect((call[0] as { since?: string }).since).toBeUndefined();
    }
  });
});

describe('getServiceActivityFromMechAnalytics — pending-tail union', () => {
  it('unions subgraph rows with no delivery timestamp', async () => {
    iterateScoredRows.mockImplementation(() => scoredRowIter([]));
    const pending = subgraphActivity({
      requestId: '0x' + '11'.repeat(32),
      deliveryBlockTimestamp: '',
    });
    const result = await getServiceActivityFromMechAnalytics({
      chainId: 100,
      serviceId: '1',
      multisigs: [REQUESTER],
      mechAddresses: [],
      subgraphActivities: [pending],
    });
    expect(result.activities).toHaveLength(1);
    expect(result.activities[0].requestId).toBe(pending.requestId);
  });

  it('drops subgraph rows that DO have a delivery (mech-analytics covers those via sort=desc)', async () => {
    iterateScoredRows.mockImplementation(() => scoredRowIter([]));
    const delivered = subgraphActivity({
      requestId: '0x' + '22'.repeat(32),
      deliveryBlockTimestamp: '9999999999',
    });
    const result = await getServiceActivityFromMechAnalytics({
      chainId: 100,
      serviceId: '1',
      multisigs: [REQUESTER],
      mechAddresses: [],
      subgraphActivities: [delivered],
    });
    expect(result.activities).toHaveLength(0);
  });

  it('forces ipfsRetrievable=false on pending subgraph rows so the FE gate treats them as non-clickable', async () => {
    iterateScoredRows.mockImplementation(() => scoredRowIter([]));
    const pending = subgraphActivity({
      requestId: '0x' + '11'.repeat(32),
      deliveryBlockTimestamp: '',
    });
    const result = await getServiceActivityFromMechAnalytics({
      chainId: 100,
      serviceId: '1',
      multisigs: [REQUESTER],
      mechAddresses: [],
      subgraphActivities: [pending],
    });
    expect(result.activities[0].ipfsRetrievable).toBe(false);
  });

  it('dedups by canonical request-id even when the twin uses BigInt.toHexString-trimmed shape', async () => {
    iterateScoredRows.mockImplementation((params: { requester?: string }) =>
      params.requester ? scoredRowIter([scoredRow()]) : scoredRowIter([]),
    );
    const trimmedTwin = subgraphActivity({
      requestId: TRIMMED_REQUEST_ID,
      deliveryBlockTimestamp: '',
    });
    const result = await getServiceActivityFromMechAnalytics({
      chainId: 100,
      serviceId: '1',
      multisigs: [REQUESTER],
      mechAddresses: [],
      subgraphActivities: [trimmedTwin],
    });
    // Only the mech-analytics row survives; the twin is deduped.
    expect(result.activities).toHaveLength(1);
    expect(result.activities[0].requestId).toBe(PADDED_REQUEST_ID);
  });
});

describe('getServiceActivityFromMechAnalytics — hasMore + degraded signals', () => {
  it('hasMore is false when no shard tripped the page cap and any row landed', async () => {
    iterateScoredRows.mockImplementation(() => scoredRowIter([scoredRow()]));
    const result = await getServiceActivityFromMechAnalytics({
      chainId: 100,
      serviceId: '1',
      multisigs: [REQUESTER],
      mechAddresses: [],
      subgraphActivities: [],
    });
    expect(result.hasMore).toBe(false);
  });

  it('hasMore is true when the descending scan trips ACTIVITY_MAX_PAGES', async () => {
    // Never yield next_cursor=null → the app-level cap kicks in.
    iterateScoredRows.mockImplementation((params: { requester?: string }) =>
      params.requester ? scoredRowPaginator([[scoredRow()]], true)() : scoredRowIter([]),
    );
    const result = await getServiceActivityFromMechAnalytics({
      chainId: 100,
      serviceId: '1',
      multisigs: [REQUESTER],
      mechAddresses: [],
      subgraphActivities: [],
    });
    expect(result.hasMore).toBe(true);
  });

  it('degraded is true when any shard rejects', async () => {
    // Make the requester scored fetch throw; others return empty.
    const rejectingIter = () =>
      // eslint-disable-next-line require-yield
      (async function* () {
        throw new Error('shard failed');
      })();
    iterateScoredRows.mockImplementation((params: { requester?: string }) =>
      params.requester ? rejectingIter() : scoredRowIter([]),
    );
    const result = await getServiceActivityFromMechAnalytics({
      chainId: 100,
      serviceId: '1',
      multisigs: [REQUESTER],
      mechAddresses: [],
      subgraphActivities: [],
    });
    expect(result.degraded).toBe(true);
  });

  it('degraded is false when every shard succeeds', async () => {
    iterateScoredRows.mockImplementation(() => scoredRowIter([]));
    const result = await getServiceActivityFromMechAnalytics({
      chainId: 100,
      serviceId: '1',
      multisigs: [REQUESTER],
      mechAddresses: [],
      subgraphActivities: [],
    });
    expect(result.degraded).toBe(false);
  });
});

describe('getServiceActivityFromMechAnalytics — sort order', () => {
  it('returns activities in descending timestamp order without the caller having to .sort()', async () => {
    iterateScoredRows.mockImplementation((params: { requester?: string }) =>
      params.requester
        ? scoredRowIter([
            scoredRow({
              request_id: '0x' + '01'.repeat(32),
              requested_at: '2026-08-01T00:00:00Z',
              delivered_at: '2026-08-01T00:00:00Z',
            }),
            scoredRow({
              request_id: '0x' + '02'.repeat(32),
              requested_at: '2026-08-30T00:00:00Z',
              delivered_at: '2026-08-30T00:00:00Z',
            }),
            scoredRow({
              request_id: '0x' + '03'.repeat(32),
              requested_at: '2026-08-15T00:00:00Z',
              delivered_at: '2026-08-15T00:00:00Z',
            }),
          ])
        : scoredRowIter([]),
    );
    const result = await getServiceActivityFromMechAnalytics({
      chainId: 100,
      serviceId: '1',
      multisigs: [REQUESTER],
      mechAddresses: [],
      subgraphActivities: [],
    });
    // Explicit ordering assertion; no caller-side .sort() so a
    // reversed comparator would trip.
    expect(result.activities.map((a) => a.requestId)).toEqual([
      '0x' + '02'.repeat(32),
      '0x' + '03'.repeat(32),
      '0x' + '01'.repeat(32),
    ]);
  });
});

describe('getServiceActivityFromMechAnalytics — timestamp mapping', () => {
  it('converts ISO delivered_at to unix seconds (not milliseconds)', async () => {
    const iso = '2026-08-30T00:00:30Z';
    const expectedSeconds = String(Math.floor(Date.parse(iso) / 1000));
    iterateScoredRows.mockImplementation((params: { requester?: string }) =>
      params.requester ? scoredRowIter([scoredRow({ delivered_at: iso })]) : scoredRowIter([]),
    );
    const result = await getServiceActivityFromMechAnalytics({
      chainId: 100,
      serviceId: '1',
      multisigs: [REQUESTER],
      mechAddresses: [],
      subgraphActivities: [],
    });
    expect(result.activities[0].deliveryBlockTimestamp).toBe(expectedSeconds);
    // Not milliseconds: a 13-digit string would fail this next check.
    expect(result.activities[0].deliveryBlockTimestamp.length).toBeLessThanOrEqual(10);
  });
});
