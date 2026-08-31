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

const REQUESTER = '0x' + '55'.repeat(20);
const MECH = '0x' + 'aa'.repeat(20);
const PADDED_REQUEST_ID = `0x${'0'.repeat(62)}42`;
const TRIMMED_REQUEST_ID = '0x42';

const scoredRow = (overrides: Partial<ScoredRow> = {}): ScoredRow => ({
  request_id: PADDED_REQUEST_ID,
  tool: 'superforcaster',
  mech_address: MECH,
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

describe('getServiceActivityFromMechAnalytics — field-wise merge (F14 + F15)', () => {
  it('fills deliveredBy + payment on a mech-analytics row from the subgraph twin, even when request-id encoding differs', async () => {
    // Scored-rows queried on `requester` returns the mech-analytics-shaped row.
    iterateScoredRows.mockImplementation((params: { requester?: string; mechAddress?: string }) =>
      params.requester ? scoredRowIter([scoredRow()]) : scoredRowIter([]),
    );

    const subgraphTwin = subgraphActivity({ requestId: TRIMMED_REQUEST_ID });
    const result = await getServiceActivityFromMechAnalytics({
      chainId: 100,
      serviceId: '1',
      multisigs: [REQUESTER],
      mechAddresses: [MECH],
      subgraphActivities: [subgraphTwin],
    });

    expect(result.activities).toHaveLength(1);
    const activity = result.activities[0];
    // mech-analytics wins for CIDs / tx hashes / source / ipfsRetrievable.
    expect(activity.requestIpfsHash).toBe('bafy-request');
    expect(activity.deliveryIpfsHash).toBe('bafy-delivery');
    expect(activity.source).toBe('mech_onchain');
    expect(activity.ipfsRetrievable).toBe(true);
    // Subgraph wins for deliveredBy (real delivery_mech) + fee columns.
    expect(activity.deliveredBy).toBe(subgraphTwin.deliveredBy);
    expect(activity.payment).toBe(subgraphTwin.payment);
    expect(activity.feeUnit).toBe(subgraphTwin.feeUnit);
    expect(activity.feeRaw).toBe(subgraphTwin.feeRaw);
    expect(activity.feeUSD).toBe(subgraphTwin.feeUSD);
    expect(activity.finalFeeUSD).toBe(subgraphTwin.finalFeeUSD);
  });
});

describe('getServiceActivityFromMechAnalytics — union scope (F16)', () => {
  it('unions subgraph rows without a delivery timestamp (pending tail)', async () => {
    iterateScoredRows.mockImplementation(() => scoredRowIter([]));
    const pending = subgraphActivity({
      requestId: '0x' + '11'.repeat(32),
      deliveryBlockTimestamp: '',
      deliveryIpfsHash: '',
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

  it('drops subgraph rows older than the newest mech-analytics delivery', async () => {
    // mech-analytics newest delivery at unix=1735689600 (2025-01-01).
    iterateScoredRows.mockImplementation((params: { requester?: string; mechAddress?: string }) =>
      params.requester
        ? scoredRowIter([
            scoredRow({
              request_id: '0x' + 'dd'.repeat(32),
              delivered_at: '2025-01-01T00:00:00Z',
            }),
          ])
        : scoredRowIter([]),
    );
    const stale = subgraphActivity({
      requestId: '0x' + 'ee'.repeat(32),
      deliveryBlockTimestamp: '1',
    });
    const result = await getServiceActivityFromMechAnalytics({
      chainId: 100,
      serviceId: '1',
      multisigs: [REQUESTER],
      mechAddresses: [],
      subgraphActivities: [stale],
    });
    expect(result.activities.map((a) => a.requestId)).toEqual(['0x' + 'dd'.repeat(32)]);
  });

  it('unions subgraph rows newer than the newest mech-analytics delivery', async () => {
    // mech-analytics newest delivery at unix=1 to force any real timestamp to be "newer".
    iterateScoredRows.mockImplementation((params: { requester?: string; mechAddress?: string }) =>
      params.requester
        ? scoredRowIter([
            scoredRow({
              request_id: '0x' + 'dd'.repeat(32),
              delivered_at: '1970-01-01T00:00:01Z',
            }),
          ])
        : scoredRowIter([]),
    );
    const newer = subgraphActivity({
      requestId: '0x' + 'ff'.repeat(32),
      deliveryBlockTimestamp: '9999999999',
    });
    const result = await getServiceActivityFromMechAnalytics({
      chainId: 100,
      serviceId: '1',
      multisigs: [REQUESTER],
      mechAddresses: [],
      subgraphActivities: [newer],
    });
    expect(result.activities.map((a) => a.requestId).sort()).toEqual(
      ['0x' + 'dd'.repeat(32), '0x' + 'ff'.repeat(32)].sort(),
    );
  });
});

describe('getServiceActivityFromMechAnalytics — since window (F13)', () => {
  it('passes a since= 30 days ago to the paginators', async () => {
    const before = Date.now();
    iterateScoredRows.mockImplementation(() => scoredRowIter([]));
    await getServiceActivityFromMechAnalytics({
      chainId: 100,
      serviceId: '1',
      multisigs: [REQUESTER],
      mechAddresses: [],
      subgraphActivities: [],
    });
    const after = Date.now();
    expect(iterateScoredRows).toHaveBeenCalled();
    const call = iterateScoredRows.mock.calls[0][0] as { since?: string };
    expect(call.since).toBeDefined();
    const sinceMs = Date.parse(call.since!);
    // 30 days = 2_592_000_000 ms, allow +-1s for scheduling wobble.
    expect(before - sinceMs).toBeGreaterThanOrEqual(30 * 86_400_000 - 1000);
    expect(after - sinceMs).toBeLessThanOrEqual(30 * 86_400_000 + 1000);
  });
});
