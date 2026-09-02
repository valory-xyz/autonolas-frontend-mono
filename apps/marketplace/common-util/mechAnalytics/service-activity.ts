import type { Activity } from 'common-util/graphql/service-activity';
import type { FeeUnit } from 'common-util/types';
import { iterateScoredRows, iterateUnscoredRows } from './client';
import { mapWithConcurrency } from './concurrency';
import type { ScoredRow } from './types';

// Bounds the parallel fetches per activity request. A single service
// with a long multisig-swap history + several mech addresses could
// otherwise fire ~30 requests at once, straining the serverless
// socket budget and the upstream.
const ACTIVITY_FETCH_CONCURRENCY = 6;

// Runaway guard on the descending scan. At DEFAULT_LIMIT=1000 rows /
// page, 5 pages caps one shard fetch at 5000 rows / ~2.5MB.
//
// Demand shards (``requester=``) use
// ``sort=requested_at&sort_direction=desc`` and get the top-5000
// rows by actual per-row request time — mech-analytics PR#40
// exposed the requested_at sort axis precisely so
// backfill-dominated services no longer fall to a ``request_id``
// tiebreak with no time meaning.
//
// The Supply shard (``delivery_mech=``) stays on the default
// ``computed_at`` axis (see the fan-out below for the trade-off:
// requested_at on Supply reintroduces B2's 30-45s timeout on
// backfill-heavy mechs because no index covers
// ``(chain_id, delivery_mech, requested_at DESC)`` today).
// Consequence: the Supply cap slice is an arbitrary
// ``request_id`` tiebreak of the ``ipfs_historical`` backfill on
// mechs whose Supply is dominated by it, until the mech-analytics
// follow-up ships the sibling covering index. Merged view is
// re-sorted client-side by ``byActivityTimestampDescending`` so
// axis mixing doesn't leak into the render.
const ACTIVITY_MAX_PAGES = 5;

export type MechAnalyticsServiceActivity = {
  id: string;
  activities: Activity[];
  // True when at least one shard hit the ACTIVITY_MAX_PAGES cap on
  // its descending scan. FE renders a "some older rows truncated"
  // banner. NOT true just because the response is non-empty —
  // that would fire on every service with any activity.
  hasMore: boolean;
  // True when at least one mech-analytics shard failed and returned
  // an empty page in its place. Downstream API layer uses this to
  // shorten the CDN TTL so a transient blip doesn't get pinned in
  // cache for the normal cache duration.
  degraded: boolean;
};

type ActivityType = Activity['activityType'];

/**
 * Fetch three row families from mech-analytics newest-first
 * (``sort_direction=desc``; ``sort=requested_at`` on Demand
 * shards only — see the Supply-shard comment for why) and merge
 * with the subgraph pending tail:
 *
 *  - scored-rows keyed on requester → Demand (delivered) for each
 *    of the service's multisigs.
 *  - unscored-rows keyed on requester → shell / abandoned requests.
 *    mech-analytics deliberately holds undelivered requests out of
 *    per_request_scores for ~24h, so freshly-fired requests won't
 *    appear here for their first day. Pending-tail rows from the
 *    subgraph fill that gap.
 *  - scored-rows keyed on delivery_mech → Supply (requests this mech
 *    actually delivered). Uses the mech-analytics ?delivery_mech=
 *    filter (alembic 017) so priority-vs-delivery divergence under
 *    the non-priority delivery path resolves correctly at the query
 *    level — no more mislabelling a request routed to this mech but
 *    delivered by another as this service's Supply activity.
 *
 * Sort axis is ``requested_at`` (per-row request time from
 * predict-api), not ``computed_at`` (when mech-analytics scored the
 * row) — the ``ipfs_historical`` backfill stamped every row with
 * one ``computed_at`` so sorting on that axis for backfill-heavy
 * mechs falls to a ``request_id`` tiebreak with no time meaning.
 * ``requested_at`` gives genuine newest-by-request-time across
 * every source. Available on mech-analytics since PR#40 (v0.0.20).
 *
 * Subgraph rows are unioned only for the pending tail (no delivery
 * timestamp) so the mech-analytics ipfsRetrievable gate stays
 * authoritative for delivered rows. Fee columns not projected by
 * mech-analytics (feeUSD / finalFeeUSD in native currency) are
 * merged in from the subgraph twin per request-id.
 */
export const getServiceActivityFromMechAnalytics = async ({
  chainId,
  serviceId,
  multisigs,
  mechAddresses,
  subgraphActivities,
}: {
  chainId: number;
  serviceId: string;
  multisigs: string[];
  mechAddresses: string[];
  subgraphActivities: Activity[];
}): Promise<MechAnalyticsServiceActivity> => {
  // Per-shard .catch() so one 5xx doesn't discard the sibling fetches.
  // Tracks failures via a shared counter so the outer response can flag
  // ``degraded`` and the API layer can shorten the CDN TTL. Without
  // this signal a transient upstream blip gets served from cache for
  // the full stale-while-revalidate window.
  let failedShards = 0;
  const safe = (
    endpoint: 'scored-rows' | 'unscored-rows',
    params: FetchParams,
  ): Promise<CappedResult> =>
    fetchCapped(endpoint, params).catch((error: unknown) => {
      failedShards += 1;
      console.warn(
        `[service-activity] mech-analytics ${endpoint} failed for ` +
          `${JSON.stringify(params)}: ${String(error)}`,
      );
      return { rows: [], hasMore: false };
    });

  const [demandScored, demandUnscored, supplyScored] = await Promise.all([
    mapWithConcurrency(multisigs, ACTIVITY_FETCH_CONCURRENCY, (multisig) =>
      safe('scored-rows', {
        chainId,
        requester: multisig,
        sortDirection: 'desc',
        sort: 'requested_at',
      }),
    ),
    mapWithConcurrency(multisigs, ACTIVITY_FETCH_CONCURRENCY, (multisig) =>
      safe('unscored-rows', {
        chainId,
        requester: multisig,
        sortDirection: 'desc',
        sort: 'requested_at',
      }),
    ),
    // Supply query filters on delivery_mech, not mech_address (which
    // is priority_mech). Correct semantics for "requests this mech
    // actually served".
    //
    // NB — deliberately no ``sort: 'requested_at'`` here (unlike the
    // two Demand shards above). mech-analytics v0.0.20 serves the
    // requested_at axis via ``prs_scored_requested_at_idx``, which
    // leads on ``requested_at`` alone — a ``?delivery_mech=`` filter
    // becomes a post-filter after the index walk. Measured on
    // ``0x77af31de935740567cf4ff1986d04b2c964a786a`` with 4M+
    // matching rows: 38s cold-cache, over the 30s client timeout,
    // reintroducing B2. Migration 018's covering
    // ``(chain_id, delivery_mech, computed_at DESC, request_id DESC)``
    // does not carry ``requested_at``, so it can't serve this
    // axis; the fast path only exists on ``computed_at`` today.
    //
    // Staying on the default ``computed_at`` axis for the Supply
    // shard trades B3 (backfill-heavy mechs' ``ipfs_historical``
    // rows share one ``computed_at`` → cap is an arbitrary
    // ``request_id`` tiebreak slice) for B2 avoidance (95ms cold
    // via the migration-018 covering index). Merged view is
    // re-sorted client-side by ``byActivityTimestampDescending``
    // below, so mixed shard axes don't mis-interleave the final
    // render. Follow-up on mech-analytics: sibling covering index
    // ``(chain_id, delivery_mech, requested_at DESC, request_id DESC)
    // WHERE tool IS NOT NULL AND delivered_at IS NOT NULL`` +
    // extending the pure-filter direct-plan gate to the
    // requested_at axis lets Supply pass ``sort: 'requested_at'``
    // too. Then this branch flips to match the Demand shards.
    mapWithConcurrency(mechAddresses, ACTIVITY_FETCH_CONCURRENCY, (mechAddress) =>
      safe('scored-rows', {
        chainId,
        deliveryMech: mechAddress,
        sortDirection: 'desc',
      }),
    ),
  ]);

  const fromMechAnalytics = [
    ...demandScored.flatMap((r) => r.rows).map((row) => mapRowToActivity(row, 'Demand')),
    ...demandUnscored.flatMap((r) => r.rows).map((row) => mapRowToActivity(row, 'Demand')),
    ...supplyScored.flatMap((r) => r.rows).map((row) => mapRowToActivity(row, 'Supply')),
  ];

  const allRows = [
    ...demandScored.flatMap((r) => r.rows),
    ...demandUnscored.flatMap((r) => r.rows),
    ...supplyScored.flatMap((r) => r.rows),
  ];

  // Track which mech-analytics rows had ``payment_type === null``
  // upstream so the twin-merge below can distinguish that from an
  // unrecognised (drifted) payment_type value — both surface as
  // ``feeUnit === null`` on the Activity but must be treated
  // differently at merge time.
  const nullPaymentTypeIds = new Set(
    allRows
      .filter((row) => row.payment_type === null)
      .map((row) => canonicalRequestId(row.request_id)),
  );

  // Drift detection: if any row's payment_type is a non-null string
  // that mapPaymentToFee doesn't recognise, that row's Payment cell
  // rendered blank silently. OR into ``degraded`` below so the FE
  // banner fires — the ``mapPaymentToFee`` console.warn alone is
  // ops-only and doesn't reach the user.
  const paymentTypeDrifted = allRows.some((row) => isDriftedPaymentType(row.payment_type));

  // Merge subgraph twin data for the columns mech-analytics either
  // doesn't project (USD amounts) or leaves NULL on the pre-013
  // historical tail (payment_type).
  //
  // deliveredBy comes directly off the mech-analytics row via
  // row.delivery_mech (alembic 017), so it's never re-sourced from
  // the twin. Payment fields (feeUnit / feeRaw / finalFeeUSD)
  // usually come from row.payment_type via mapPaymentToFee, but on
  // rows where payment_type is NULL (pre-013 tail) the mapper
  // produces nulls — those rows fall back to the twin so the
  // Payment row doesn't get silently dropped for a documented
  // legitimate-null class. Unknown payment_type strings (schema
  // drift) intentionally do NOT fall back: they stay blank and
  // mapPaymentToFee's caller emits a console.warn so ops can chase
  // upstream. Otherwise a new payment type would silently mislabel
  // as whatever the twin happens to carry.
  //
  // feeUSD / finalFeeUSD always take the twin when the twin has
  // them: mech-analytics doesn't project USD amounts at all, so the
  // subgraph is authoritative for those two.
  //
  // Request-id canonicalisation: mech-analytics is 0x + 64 lowercase
  // hex; the marketplace subgraph legacy path uses BigInt.toHexString()
  // which trims leading zeros (roughly 1 in 16 ids loses a nibble).
  // Both sides go through canonicalRequestId so the map lookup finds
  // the twin for that class of rows.
  const bySubgraph = new Map(subgraphActivities.map((a) => [canonicalRequestId(a.requestId), a]));
  const merged: Activity[] = fromMechAnalytics.map((a) => {
    const canonicalId = canonicalRequestId(a.requestId);
    const twin = bySubgraph.get(canonicalId);
    if (!twin) return a;
    // Only the pre-013 legitimate-null shape falls back to the twin
    // for Payment. An unrecognised (drifted) payment_type stays
    // blank + logged so we don't silently mislabel via the twin.
    const shouldFallBackPayment = nullPaymentTypeIds.has(canonicalId);
    return {
      ...a,
      payment: shouldFallBackPayment ? (twin.payment ?? a.payment ?? null) : a.payment,
      feeUnit: shouldFallBackPayment ? (twin.feeUnit ?? a.feeUnit ?? null) : a.feeUnit,
      feeRaw: shouldFallBackPayment ? (twin.feeRaw ?? a.feeRaw ?? null) : a.feeRaw,
      feeUSD: twin.feeUSD ?? a.feeUSD ?? null,
      finalFeeUSD: twin.finalFeeUSD ?? a.finalFeeUSD ?? null,
    };
  });

  // Pending-tail union: subgraph rows for requests mech-analytics
  // hasn't seen yet (< 24h old and undelivered). Restricted to rows
  // that (a) aren't already in the mech-analytics set, AND (b) have
  // no delivery timestamp — a subgraph row with a delivery is
  // covered by mech-analytics via ``sort_direction=desc``, so
  // unioning delivered subgraph rows would bypass the
  // ipfsRetrievable gate for no gain.
  //
  // Set ipfsRetrievable=false on pending rows entering the union so
  // the FE gate treats them as non-clickable (subgraph mappers
  // don't set the field, so consumers gating on ``!== false`` would
  // render every CID as a live gateway link otherwise).
  const seenIds = new Set(merged.map((a) => canonicalRequestId(a.requestId)));
  const pendingTail = subgraphActivities
    .filter((a) => {
      if (seenIds.has(canonicalRequestId(a.requestId))) return false;
      return !a.deliveryBlockTimestamp;
    })
    .map((a) => ({ ...a, ipfsRetrievable: false as const }));

  const activities = [...merged, ...pendingTail];
  activities.sort(byActivityTimestampDescending);

  const pageCapTripped =
    demandScored.some((r) => r.hasMore) ||
    demandUnscored.some((r) => r.hasMore) ||
    supplyScored.some((r) => r.hasMore);

  return {
    id: serviceId,
    activities,
    hasMore: pageCapTripped,
    // Fold payment-type drift into degraded so the FE banner
    // surfaces silently-blanked Payment cells alongside shard
    // failures. Drift and shard-failure are both "partial data",
    // one signal is enough.
    degraded: failedShards > 0 || paymentTypeDrifted,
  };
};

// Normalise cross-source request-id encodings so the merge key
// agrees. mech-analytics writes 0x + 64 lowercase hex. The
// marketplace subgraph legacy path (src/agent-mech.ts) uses
// BigInt.toHexString(), which trims leading zeros and can drop a
// nibble or a byte for ~1/16 of ids.
const canonicalRequestId = (id: string): string => {
  if (!id) return '';
  if (/^0x[0-9a-fA-F]*$/.test(id)) {
    return `0x${id.slice(2).toLowerCase().padStart(64, '0')}`;
  }
  return id.toLowerCase();
};

type FetchParams = {
  chainId: number;
  requester?: string;
  deliveryMech?: string;
  sortDirection?: 'asc' | 'desc';
  sort?: 'requested_at' | 'computed_at';
};

type CappedResult = { rows: ScoredRow[]; hasMore: boolean };

const fetchCapped = async (
  endpoint: 'scored-rows' | 'unscored-rows',
  params: FetchParams,
): Promise<CappedResult> => {
  const rows: ScoredRow[] = [];
  let pages = 0;
  const iterator =
    endpoint === 'scored-rows' ? iterateScoredRows(params) : iterateUnscoredRows(params);
  for await (const page of iterator) {
    rows.push(...page.rows);
    pages += 1;
    if (pages >= ACTIVITY_MAX_PAGES) {
      // Distinguish "cap hit AND upstream has more rows" from
      // "cap hit exactly at exhaustion" via the cursor the API
      // returned. Without this, a shard whose history is exactly
      // ACTIVITY_MAX_PAGES * DEFAULT_LIMIT rows (~5000) would
      // trip a spurious "some older rows were truncated" banner
      // with nothing actually truncated.
      return { rows, hasMore: page.nextCursor !== null };
    }
  }
  return { rows, hasMore: false };
};

// ISO -> unix-seconds-string so the subgraph-side sortActivities
// (which does Number(...)) stays interchangeable.
const isoToUnixSecondsString = (iso: string | null): string =>
  iso ? String(Math.floor(new Date(iso).getTime() / 1000)) : '';

// Single source of truth for the payment_type → fee mapping.
// mech-analytics stores the token identifier separately from the raw
// amount; this table maps each known token to the fee-unit + decoded
// fee it produces. Adding a new payment type is one line here, and
// both ``mapPaymentToFee`` (below) and ``isDriftedPaymentType`` pick
// it up automatically via ``Map.has()`` / ``Map.get()``.
//
// A ``Map`` (rather than an object) matters here for correctness:
// object keys share their namespace with ``Object.prototype``
// members, so ``('toString' in obj)`` is ``true`` and
// ``obj['valueOf']`` returns the prototype method. The prior
// object-typed table let a drifted ``payment_type='valueOf'``
// resolve to ``Object.prototype.valueOf`` and get called as
// ``mapper(deliveryRate)`` inside the ``.map(mapRowToActivity)``
// pass that runs outside the ``safe()`` wrapper — one row would
// take down the whole activity request. ``Map`` has no prototype
// surface at all, so lookups only find entries we put there.
const PAYMENT_TYPE_TO_FEE = new Map<
  string,
  (deliveryRate: string) => Pick<Activity, 'feeUnit' | 'feeRaw' | 'finalFeeUSD'>
>([
  ['native', (rate) => ({ feeUnit: 'NATIVE', feeRaw: rate, finalFeeUSD: null })],
  // USDC is 6-decimal micro-USDC on the wire. Small amounts
  // (< 2^53 / 1e6 ≈ $9 billion) fit safely in float53, so a direct
  // divide is safe here. formatPayment reads finalFeeUSD for the
  // USDC branch and prints it as $X.XX.
  [
    'usdc',
    (rate) => ({
      feeUnit: 'USDC',
      feeRaw: rate,
      finalFeeUSD: (Number(rate) / 1e6).toFixed(2),
    }),
  ],
  ['nvm_subscription', (rate) => ({ feeUnit: 'CREDITS', feeRaw: rate, finalFeeUSD: null })],
]);

// True when the row's payment_type is a non-null string that
// ``mapPaymentToFee`` doesn't recognise (schema drift). Consumers OR
// this into the response's ``degraded`` flag so the FE banner
// renders when drift silently blanks a Payment row. Derived from
// ``PAYMENT_TYPE_TO_FEE.has`` so adding / removing a payment type
// keeps this predicate in sync automatically.
export const isDriftedPaymentType = (paymentType: string | null): boolean =>
  paymentType !== null && !PAYMENT_TYPE_TO_FEE.has(paymentType);

// Bounded LRU-ish cache of payment_type strings we've already warned
// about, so a batch of drift rows produces one log line per
// unrecognised value rather than one per row. Bounded because the
// key is a string from an independently-deployed upstream and this
// Set lives for the life of a warm container; without a cap a
// malicious or malformed upstream could balloon it. Cap matches the
// convention set by ``util/apiCache.ts``. When the cap trips we
// evict the oldest, so a class of drift that lasts longer than the
// cache re-fires occasionally rather than going permanently silent.
const WARNED_PAYMENT_TYPES_CAP = 100;
const warnedPaymentTypes = new Set<string>();

const mapPaymentToFee = (
  paymentType: string | null,
  deliveryRate: string | null,
): Pick<Activity, 'feeUnit' | 'feeRaw' | 'finalFeeUSD'> => {
  // ``== null`` (loose) not ``=== null``: the API response goes
  // through an unchecked cast on the client, so a drifted schema
  // could deliver ``undefined`` here while still typed
  // ``string | null``. Strict-null would fall through to a mapper
  // whose numeric decode gives ``NaN``, and ``NaN.toFixed(2)`` is
  // the string ``"NaN"`` — truthy, so formatPayment would render
  // ``$NaN`` as a payment amount instead of falling back to N/A.
  if (deliveryRate == null) {
    return { feeUnit: null, feeRaw: null, finalFeeUSD: null };
  }
  // Legitimate pre-013 historical tail — no payment_type recorded
  // upstream. Caller falls back to the subgraph twin for the
  // Payment row. Silent: this is expected, not drift.
  if (paymentType === null) {
    return { feeUnit: null, feeRaw: null, finalFeeUSD: null };
  }
  const mapper = PAYMENT_TYPE_TO_FEE.get(paymentType);
  if (mapper) return mapper(deliveryRate);
  // Unrecognised payment_type is schema drift. Stay blank so a new
  // mislabel doesn't sneak in via the twin fallback (drift
  // detection above ORs into ``degraded`` so the FE banner fires
  // alongside this log).
  if (!warnedPaymentTypes.has(paymentType)) {
    if (warnedPaymentTypes.size >= WARNED_PAYMENT_TYPES_CAP) {
      // Evict the oldest inserted value so the cap holds. If drift
      // is long-lived enough to wrap around the cap, the same
      // value re-warns after eviction rather than going silent for
      // the life of the container.
      const oldest = warnedPaymentTypes.values().next().value;
      if (oldest !== undefined) warnedPaymentTypes.delete(oldest);
    }
    warnedPaymentTypes.add(paymentType);
    console.warn(
      `[service-activity] unrecognised payment_type=${JSON.stringify(paymentType)}; ` +
        'leaving fee fields blank. Add a case to PAYMENT_TYPE_TO_FEE or upstream this value.',
    );
  }
  return { feeUnit: null, feeRaw: null, finalFeeUSD: null };
};

const mapRowToActivity = (row: ScoredRow, activityType: ActivityType): Activity => {
  const fee = mapPaymentToFee(row.payment_type, row.delivery_rate);
  return {
    activityType,
    requestId: row.request_id,
    requestIpfsHash: row.request_ipfs_hash ?? '',
    requestBlockTimestamp: isoToUnixSecondsString(row.requested_at),
    requestedBy: row.requester,
    requestTransactionHash: row.request_tx_hash ?? '',
    deliveryIpfsHash: row.delivery_ipfs_hash ?? '',
    // Real delivery_mech from alembic 017 — no more priority-mech
    // mislabel. Legitimately empty for undelivered rows.
    deliveredBy: row.delivery_mech ?? '',
    deliveryTransactionHash: row.delivery_tx_hash ?? '',
    deliveryBlockTimestamp: isoToUnixSecondsString(row.delivered_at),
    source: row.source ?? null,
    ipfsRetrievable: row.ipfs_retrievable,
    // Raw for consumers that want the value as-stored. formatPayment
    // uses feeUnit + feeRaw / finalFeeUSD, not this field.
    deliveryRate: row.delivery_rate,
    feeUnit: fee.feeUnit as FeeUnit | null,
    feeRaw: fee.feeRaw,
    finalFeeUSD: fee.finalFeeUSD,
  };
};

const activityTimestamp = (a: Activity): number =>
  Math.max(Number(a.deliveryBlockTimestamp) || 0, Number(a.requestBlockTimestamp) || 0);

const byActivityTimestampDescending = (a: Activity, b: Activity): number =>
  activityTimestamp(b) - activityTimestamp(a);
