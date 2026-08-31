import type { Activity } from 'common-util/graphql/service-activity';
import { iterateScoredRows, iterateUnscoredRows } from './client';
import { mapWithConcurrency } from './concurrency';
import type { ScoredRow } from './types';

// Bounds the parallel fetches per activity request. Same trade-off as
// the requester-metrics fan-out in services.ts — a single service
// with a long multisig-swap history + several mech addresses could
// otherwise fire ~30 requests at once, straining the serverless
// socket budget and the upstream.
const ACTIVITY_FETCH_CONCURRENCY = 6;

// Server-side window for `/v1/data/scored-rows` and `/v1/data/unscored-rows`.
// mech-analytics orders ASC by (computed_at, request_id) with a `>` keyset
// cursor and has no sort-direction knob, so paging without a `since`
// bound keeps the OLDEST rows and drops the newest. Bounding the window
// server-side keeps the tab focused on recent activity; page cap stays
// as a runaway guard only.
const ACTIVITY_WINDOW_DAYS = 30;

export type MechAnalyticsServiceActivity = {
  id: string;
  activities: Activity[];
  // True when the 30-day window applies (i.e. the tab is intentionally
  // scoped and older activity may still exist upstream). FE renders a
  // one-line "showing recent" hint.
  hasMore: boolean;
};

// At DEFAULT_LIMIT=1000 rows/page, 5 pages caps a single fetch at 5000
// rows / ~2.5MB. Combined with the 30-day `since` window this is a
// runaway guard rather than a truncation strategy — a service that
// legitimately exceeds it within 30 days is an anomaly worth logging.
const ACTIVITY_MAX_PAGES = 5;

type ActivityType = Activity['activityType'];

/**
 * Fetch three row families to approximate the subgraph path's envelope,
 * scoped to the last 30 days (server-side `since=` window):
 *
 *  - scored-rows keyed on requester → Demand (delivered).
 *  - unscored-rows keyed on requester → shell / abandoned requests.
 *    Note: mech-analytics deliberately holds undelivered requests out
 *    of per_request_scores until they are >24h old, so a freshly-fired
 *    in-flight request will NOT appear here for its first day. F10
 *    handles this via the subgraph union below.
 *  - scored-rows keyed on mech_address → "requests routed to this
 *    mech" (i.e. priority-mech assignments). Note: this is NOT
 *    "requests this mech delivered" — mech-analytics only projects
 *    ``priority_mech`` into ``mech_address``, not ``delivery_mech``.
 *    Under the marketplace's non-priority delivery path (any registered
 *    mech may deliver once the priority window lapses), the two sets
 *    diverge. F9 tracks upstreaming a ``delivery_mech`` projection to
 *    mech-analytics; until then ``deliveredBy`` on mech-analytics rows
 *    is filled from the subgraph twin (see the field-wise merge below).
 */
export const getServiceActivityFromMechAnalytics = async ({
  chainId,
  serviceId,
  multisigs,
  mechAddresses,
  // F10 / F16: subgraph activities are unioned in only for what
  // mech-analytics genuinely cannot have yet — pending requests with
  // no delivery, plus deliveries newer than the newest mech-analytics
  // delivery timestamp. The rest of the subgraph history is thrown
  // away because it would bypass the `ipfsRetrievable` gate and add
  // per-request cost without new information.
  subgraphActivities,
  signal,
}: {
  chainId: number;
  serviceId: string;
  multisigs: string[];
  mechAddresses: string[];
  subgraphActivities: Activity[];
  signal?: AbortSignal;
}): Promise<MechAnalyticsServiceActivity> => {
  const since = new Date(Date.now() - ACTIVITY_WINDOW_DAYS * 86_400_000).toISOString();

  // Failure isolation: a per-endpoint .catch() so one 5xx doesn't
  // discard the sibling fetches. Empty result on failure — the caller
  // sees a smaller (not blank) activity list, and hasMore stays
  // representative of what actually succeeded.
  const safe = (
    endpoint: 'scored-rows' | 'unscored-rows',
    params: FetchParams,
  ): Promise<CappedResult> =>
    fetchCapped(endpoint, params).catch((error: unknown) => {
      console.warn(
        `[service-activity] mech-analytics ${endpoint} failed for ` +
          `${JSON.stringify({ ...params, signal: undefined })}: ${String(error)}`,
      );
      return { rows: [], hasMore: false };
    });

  const [demandScored, demandUnscored, supplyScored] = await Promise.all([
    mapWithConcurrency(multisigs, ACTIVITY_FETCH_CONCURRENCY, (multisig) =>
      safe('scored-rows', { chainId, requester: multisig, since, signal }),
    ),
    mapWithConcurrency(multisigs, ACTIVITY_FETCH_CONCURRENCY, (multisig) =>
      safe('unscored-rows', { chainId, requester: multisig, since, signal }),
    ),
    mapWithConcurrency(mechAddresses, ACTIVITY_FETCH_CONCURRENCY, (mechAddress) =>
      safe('scored-rows', { chainId, mechAddress, since, signal }),
    ),
  ]);

  const fromMechAnalytics = [
    ...demandScored.flatMap((r) => r.rows).map((row) => mapRowToActivity(row, 'Demand')),
    ...demandUnscored.flatMap((r) => r.rows).map((row) => mapRowToActivity(row, 'Demand')),
    ...supplyScored.flatMap((r) => r.rows).map((row) => mapRowToActivity(row, 'Supply')),
  ];

  // F14 — field-wise merge. mech-analytics wins for tx hashes, CIDs,
  // source, ipfsRetrievable, deliveryRate. Subgraph wins for
  // deliveredBy (real delivery_mech, not priority_mech) and the fee
  // columns (mech-analytics doesn't project fee_unit / fee_raw yet).
  // Without this, Delivered By renders N/A and the Payment row in the
  // modal disappears for every mech-analytics-sourced row.
  //
  // F15 — canonicalise the request-id on both sides. mech-analytics is
  // 0x + 64 lowercase hex; the marketplace subgraph legacy path uses
  // BigInt.toHexString(), which trims leading zeros (roughly 1 in 16
  // ids loses a nibble). Without canonicalisation the dedup misses on
  // those rows and the same request renders twice with different
  // Delivered By / Payment values.
  const bySubgraph = new Map(subgraphActivities.map((a) => [canonicalRequestId(a.requestId), a]));
  const merged: Activity[] = fromMechAnalytics.map((a) => {
    const twin = bySubgraph.get(canonicalRequestId(a.requestId));
    if (!twin) return a;
    return {
      ...a,
      deliveredBy: a.deliveredBy || twin.deliveredBy,
      payment: twin.payment ?? a.payment ?? null,
      feeUnit: twin.feeUnit ?? a.feeUnit ?? null,
      feeRaw: twin.feeRaw ?? a.feeRaw ?? null,
      feeUSD: twin.feeUSD ?? a.feeUSD ?? null,
      finalFeeUSD: twin.finalFeeUSD ?? a.finalFeeUSD ?? null,
    };
  });

  // F16 — scope the union. The purpose is the ~24h pending-tail gap;
  // unioning the full subgraph history is wrong because those rows
  // (a) bypass `ipfsRetrievable` (undefined !== false, so every CID
  // renders a live gateway link including off-chain CIDs whose links
  // 404), and (b) inflate the response size without adding new
  // information. Keep only: pending rows (no delivery timestamp), and
  // deliveries newer than the newest mech-analytics delivery.
  const seenIds = new Set(merged.map((a) => canonicalRequestId(a.requestId)));
  const newestMechAnalyticsDelivery = merged.reduce(
    (max, a) => Math.max(max, Number(a.deliveryBlockTimestamp) || 0),
    0,
  );
  const pendingTail = subgraphActivities.filter((a) => {
    if (seenIds.has(canonicalRequestId(a.requestId))) return false;
    const ts = Number(a.deliveryBlockTimestamp) || 0;
    return ts === 0 || ts > newestMechAnalyticsDelivery;
  });

  const activities = [...merged, ...pendingTail];
  activities.sort(byActivityTimestampDescending);

  // hasMore semantics: the 30-day window is applied, so older activity
  // may exist upstream. Also fires when the runaway page cap trips
  // within the window (an anomaly, but still user-visible truncation).
  const pageCapTripped =
    demandScored.some((r) => r.hasMore) ||
    demandUnscored.some((r) => r.hasMore) ||
    supplyScored.some((r) => r.hasMore);
  const hasMore = pageCapTripped || activities.length > 0;

  return { id: serviceId, activities, hasMore };
};

// Normalise cross-source request-id encodings so the merge / dedup key
// agrees. mech-analytics writes `0x` + 64 lowercase hex. The
// marketplace subgraph legacy path (`src/agent-mech.ts`) uses
// `BigInt.toHexString()`, which trims leading zeros and can drop a
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
  mechAddress?: string;
  since?: string;
  signal?: AbortSignal;
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
    rows.push(...page);
    pages += 1;
    if (pages >= ACTIVITY_MAX_PAGES) {
      return { rows, hasMore: true };
    }
  }
  return { rows, hasMore: false };
};

// ISO -> unix-seconds-string so the subgraph-side `sortActivities`
// (which does `Number(...)`) stays interchangeable.
const isoToUnixSecondsString = (iso: string | null): string =>
  iso ? String(Math.floor(new Date(iso).getTime() / 1000)) : '';

const mapRowToActivity = (row: ScoredRow, activityType: ActivityType): Activity => ({
  activityType,
  requestId: row.request_id,
  requestIpfsHash: row.request_ipfs_hash ?? '',
  requestBlockTimestamp: isoToUnixSecondsString(row.requested_at),
  requestedBy: row.requester,
  requestTransactionHash: row.request_tx_hash ?? '',
  deliveryIpfsHash: row.delivery_ipfs_hash ?? '',
  // mech-analytics aliases ``priority_mech`` into ``mech_address``,
  // not the mech that actually delivered. Left blank at the mapper —
  // the field-wise merge above fills it from the subgraph twin's
  // ``Deliver.mech`` (real delivery_mech) when one exists.
  deliveredBy: '',
  deliveryTransactionHash: row.delivery_tx_hash ?? '',
  deliveryBlockTimestamp: isoToUnixSecondsString(row.delivered_at),
  source: row.source ?? null,
  ipfsRetrievable: row.ipfs_retrievable,
  // Intentionally NOT setting `payment`. formatPayment's legacy branch
  // runs parseToEth (hardcoded 18 decimals) with a chain-native label,
  // so a USDC-paid request at "1000000" (1 USDC in 6-decimal wei)
  // renders as "0.000000000001 xDAI". The field-wise merge above will
  // fill payment / feeUnit / feeRaw / feeUSD from the subgraph twin
  // when one exists. Raw value stays on `deliveryRate` for the future
  // token-aware renderer.
  deliveryRate: row.delivery_rate,
});

const activityTimestamp = (a: Activity): number =>
  Math.max(Number(a.deliveryBlockTimestamp) || 0, Number(a.requestBlockTimestamp) || 0);

const byActivityTimestampDescending = (a: Activity, b: Activity): number =>
  activityTimestamp(b) - activityTimestamp(a);
