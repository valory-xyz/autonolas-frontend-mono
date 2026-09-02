import type { Activity } from 'common-util/graphql/service-activity';
import {
  getServiceActivityFromMechAnalytics,
  isDriftedPaymentType,
} from 'common-util/mechAnalytics/service-activity';
import type { ScoredRow } from 'common-util/mechAnalytics/types';

jest.mock('common-util/mechAnalytics/client', () => {
  const iter = (rows: ScoredRow[]) =>
    (async function* () {
      yield { rows, nextCursor: null };
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
    yield { rows, nextCursor: null };
  })();

// A paginator that yields a fixed set of pages, each with the given
// nextCursor (null on the last page). Callers control whether the
// final page carries a cursor so fetchCapped's exactly-at-cap
// behaviour can be pinned.
const scoredRowPaginator = (pages: { rows: ScoredRow[]; nextCursor: string | null }[]) =>
  async function* () {
    for (const page of pages) {
      yield page;
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

describe('isDriftedPaymentType — single source of truth with mapPaymentToFee', () => {
  // If these two ever fall out of sync, the failure modes are bad
  // in both directions (silent blanks vs permanent banner). We pin
  // them jointly so adding / removing a payment type has to keep
  // both sides consistent.
  it('returns false for every known payment type mapPaymentToFee handles', async () => {
    // The known set is derived from PAYMENT_TYPE_TO_FEE keys inside
    // the module. If a caller adds a mapping without exporting the
    // known-set, this test would catch a mismatch through
    // isDriftedPaymentType flagging it as drift.
    for (const known of ['native', 'usdc', 'nvm_subscription']) {
      expect(isDriftedPaymentType(known)).toBe(false);
    }
  });

  it('returns true for any string not registered in the mapping', () => {
    expect(isDriftedPaymentType('unknown_future_token')).toBe(true);
    expect(isDriftedPaymentType('')).toBe(true);
    expect(isDriftedPaymentType('NATIVE')).toBe(true); // case-sensitive
  });

  it('returns false for the legitimate NULL tail (not drift)', () => {
    expect(isDriftedPaymentType(null)).toBe(false);
  });

  // Ojuswi review 2026-09-02 (round-8 approval): the prior
  // ``paymentType in obj`` / ``obj[paymentType]`` shape walked the
  // prototype chain, so ``'toString'`` was treated as a known
  // payment type (silent blank) and ``'valueOf'`` / ``'__proto__'``
  // threw ``TypeError`` inside the ``.map(mapRowToActivity)`` pass
  // that runs outside the ``safe()`` per-shard wrapper — one drift
  // row would 500 the whole activity request. Map's ``.has`` /
  // ``.get`` have no prototype surface, so lookups only find
  // entries we put there. Pinning that here so a future refactor
  // back to an object literal is caught.
  it.each(['toString', 'valueOf', 'hasOwnProperty', 'constructor', '__proto__'])(
    'treats Object.prototype member %s as drift, not as a known payment type',
    (prototypeMember) => {
      expect(isDriftedPaymentType(prototypeMember)).toBe(true);
    },
  );
});

describe('mapPaymentToFee — drift on Object.prototype names is graceful, not fatal', () => {
  // Regression guard for the same prototype-chain bug tested above,
  // but on the lookup side. The prior ``PAYMENT_TYPE_TO_FEE[key]``
  // access returned ``Object.prototype.valueOf`` etc. for these
  // strings and then invoked them as ``mapper(deliveryRate)`` with
  // no ``this``, which throws in strict mode. That throw landed in
  // ``.map(mapRowToActivity)`` — outside the per-shard ``safe()``
  // wrapper — so a single drift row would 500 the whole request.
  // With Map, the lookup returns ``undefined`` and we fall through
  // to the drift-warning path.
  //
  // We drive this end-to-end through the handler (rather than
  // importing ``mapPaymentToFee`` directly, which isn't exported)
  // so the test also proves the outer ``.map`` doesn't throw.
  it.each(['toString', 'valueOf', 'hasOwnProperty', 'constructor', '__proto__'])(
    'renders payment_type=%s as a blank Payment cell without throwing',
    async (prototypeMember) => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      iterateScoredRows.mockImplementation(
        (params: { requester?: string; deliveryMech?: string }) =>
          params.requester
            ? scoredRowIter([
                scoredRow({ payment_type: prototypeMember, delivery_rate: '1000000' }),
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

      expect(result.activities).toHaveLength(1);
      const activity = result.activities[0];
      // Blank fee fields (drift → fall back to twin merge, which is
      // empty here so they end up null).
      expect(activity.feeUnit).toBeNull();
      expect(activity.feeRaw).toBeNull();
      expect(activity.finalFeeUSD).toBeNull();
      // Drift signal fires so the FE banner renders.
      expect(result.degraded).toBe(true);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('unrecognised payment_type='));
      warn.mockRestore();
    },
  );
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

  it('maps payment_type=nvm_subscription to feeUnit=CREDITS', async () => {
    iterateScoredRows.mockImplementation(() =>
      scoredRowIter([scoredRow({ payment_type: 'nvm_subscription', delivery_rate: '100' })]),
    );
    const result = await getServiceActivityFromMechAnalytics({
      chainId: 100,
      serviceId: '1',
      multisigs: [REQUESTER],
      mechAddresses: [],
      subgraphActivities: [],
    });
    expect(result.activities[0].feeUnit).toBe('CREDITS');
    expect(result.activities[0].feeRaw).toBe('100');
    expect(result.activities[0].finalFeeUSD).toBeNull();
  });

  it('unknown payment_type leaves fee fields empty AND logs (drift signal)', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    // Include a random suffix so this test can be re-run without the
    // in-module warned-set cache making the console.warn a no-op.
    const drifted = `unknown_future_token_${Date.now()}_${Math.random()}`;
    iterateScoredRows.mockImplementation(() =>
      scoredRowIter([scoredRow({ payment_type: drifted, delivery_rate: '42' })]),
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
    // Drift is a signal, not silent — every sibling degrade path in
    // this file logs.
    expect(warn).toHaveBeenCalledWith(expect.stringContaining(drifted));
    // And the FE banner needs to fire alongside the log — drift OR's
    // into the degraded flag on the response.
    expect(result.degraded).toBe(true);
    warn.mockRestore();
  });

  it('payment_type=null (pre-013 tail) does NOT log and does NOT flip degraded', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    iterateScoredRows.mockImplementation(() =>
      scoredRowIter([scoredRow({ payment_type: null, delivery_rate: '42' })]),
    );

    const result = await getServiceActivityFromMechAnalytics({
      chainId: 100,
      serviceId: '1',
      multisigs: [REQUESTER],
      mechAddresses: [],
      subgraphActivities: [],
    });

    expect(warn).not.toHaveBeenCalled();
    // Legit null is expected data, not degradation.
    expect(result.degraded).toBe(false);
    warn.mockRestore();
  });

  it('undefined delivery_rate (drifted response shape) does NOT render $NaN — falls back to null fee fields', async () => {
    // The client's ``as T`` cast is unchecked, so a drifted API
    // response with delivery_rate absent could arrive as undefined
    // at runtime even though the type says string | null. Strict
    // ``=== null`` would fall through to the USDC branch, and
    // ``Number(undefined) / 1e6 = NaN`` would produce the string
    // ``"NaN"`` (truthy → formatPayment renders ``$NaN``).
    iterateScoredRows.mockImplementation(() =>
      scoredRowIter([
        scoredRow({
          payment_type: 'usdc',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          delivery_rate: undefined as any,
        }),
      ]),
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

  it('payment_type=null falls back to the subgraph twin for payment / feeUnit / feeRaw', async () => {
    // Regression test for the pre-013 historical tail. Previously
    // dropped the Payment row for these rows because the merge
    // narrowed to feeUSD / finalFeeUSD only.
    iterateScoredRows.mockImplementation((params: { requester?: string }) =>
      params.requester
        ? scoredRowIter([scoredRow({ payment_type: null, delivery_rate: null })])
        : scoredRowIter([]),
    );
    const twin = subgraphActivity({
      requestId: TRIMMED_REQUEST_ID,
      payment: '25000000000000000',
      feeUnit: 'NATIVE',
      feeRaw: '25000000000000000',
    });
    const result = await getServiceActivityFromMechAnalytics({
      chainId: 100,
      serviceId: '1',
      multisigs: [REQUESTER],
      mechAddresses: [],
      subgraphActivities: [twin],
    });
    expect(result.activities[0].payment).toBe('25000000000000000');
    expect(result.activities[0].feeUnit).toBe('NATIVE');
    expect(result.activities[0].feeRaw).toBe('25000000000000000');
  });

  it('unknown payment_type does NOT fall back to the subgraph twin (drift stays blank)', async () => {
    // Otherwise a future upstream drift would silently mislabel via
    // whatever the twin happens to carry.
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const drifted = `unknown_future_token_${Date.now()}_${Math.random()}`;
    iterateScoredRows.mockImplementation((params: { requester?: string }) =>
      params.requester
        ? scoredRowIter([scoredRow({ payment_type: drifted, delivery_rate: '42' })])
        : scoredRowIter([]),
    );
    const twin = subgraphActivity({
      requestId: TRIMMED_REQUEST_ID,
      payment: '25000000000000000',
      feeUnit: 'NATIVE',
      feeRaw: '25000000000000000',
    });
    const result = await getServiceActivityFromMechAnalytics({
      chainId: 100,
      serviceId: '1',
      multisigs: [REQUESTER],
      mechAddresses: [],
      subgraphActivities: [twin],
    });
    // Mapper returned nulls with a log; feeUnit stays null despite the
    // twin having 'NATIVE'.
    expect(result.activities[0].feeUnit).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
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

  it('passes sort=requested_at on every fan-out shard so newest is by request time', async () => {
    // ``computed_at`` (mech-analytics' default sort) degenerates on
    // the ``ipfs_historical`` backfill — every backfill row shares
    // one ``computed_at`` (the backfill moment), so DESC falls to
    // ``request_id`` tiebreak with no time meaning. Sorting on
    // ``requested_at`` (per-row request time from predict-api)
    // gives genuine newest-first across every source. The activity
    // feed must apply this on every fan-out shard, not just some,
    // otherwise a mech's rows would arrive on two different sort
    // axes and the merged view would interleave wrong.
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
      expect((call[0] as { sort?: string }).sort).toBe('requested_at');
    }
    for (const call of iterateUnscoredRows.mock.calls) {
      expect((call[0] as { sort?: string }).sort).toBe('requested_at');
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

  it('hasMore is true when the cap trips AND the last page still had a cursor', async () => {
    // ACTIVITY_MAX_PAGES = 5. Emit 5 pages, each with a non-null
    // nextCursor: fetchCapped hits the cap at page 5 and the last
    // page's cursor says "more upstream" → hasMore=true.
    const fivePages = Array.from({ length: 5 }, (_, i) => ({
      rows: [scoredRow({ request_id: `0x${(i + 1).toString(16).padStart(64, '0')}` })],
      nextCursor: `cursor-${i + 1}`,
    }));
    iterateScoredRows.mockImplementation((params: { requester?: string }) =>
      params.requester ? scoredRowPaginator(fivePages)() : scoredRowIter([]),
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

  it('hasMore is FALSE when the cap trips exactly at exhaustion', async () => {
    // Same 5 pages, but the LAST one has nextCursor=null: the shard
    // has exactly ACTIVITY_MAX_PAGES pages of history. The banner
    // must not fire because there's nothing behind the last page.
    const fivePages = Array.from({ length: 5 }, (_, i) => ({
      rows: [scoredRow({ request_id: `0x${(i + 1).toString(16).padStart(64, '0')}` })],
      nextCursor: i === 4 ? null : `cursor-${i + 1}`,
    }));
    iterateScoredRows.mockImplementation((params: { requester?: string }) =>
      params.requester ? scoredRowPaginator(fivePages)() : scoredRowIter([]),
    );
    const result = await getServiceActivityFromMechAnalytics({
      chainId: 100,
      serviceId: '1',
      multisigs: [REQUESTER],
      mechAddresses: [],
      subgraphActivities: [],
    });
    expect(result.hasMore).toBe(false);
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
