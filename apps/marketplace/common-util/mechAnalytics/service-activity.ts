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
// page, 5 pages caps one shard fetch at 5000 rows / ~2.5MB. Combined
// with sort_direction=desc these are the 5000 NEWEST rows per shard,
// which is the "recent activity" the tab exists to show. A service
// with more than 5000 delivered rows in the newest window is an
// anomaly worth flagging via the hasMore signal rather than a
// silent truncation.
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
 * (sort_direction=desc) and merge with the subgraph pending tail:
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
      safe('scored-rows', { chainId, requester: multisig, sortDirection: 'desc' }),
    ),
    mapWithConcurrency(multisigs, ACTIVITY_FETCH_CONCURRENCY, (multisig) =>
      safe('unscored-rows', { chainId, requester: multisig, sortDirection: 'desc' }),
    ),
    // Supply query filters on delivery_mech, not mech_address (which
    // is priority_mech). Correct semantics for "requests this mech
    // actually served".
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

  // Merge subgraph twin data for columns mech-analytics doesn't
  // project. deliveredBy + payment + feeUnit + feeRaw now come
  // directly off the mech-analytics row (alembic 017 exposes
  // delivery_mech + payment_type). Subgraph twin only contributes
  // feeUSD / finalFeeUSD, which mech-analytics doesn't have.
  //
  // Request-id canonicalisation: mech-analytics is 0x + 64 lowercase
  // hex; the marketplace subgraph legacy path uses BigInt.toHexString()
  // which trims leading zeros (roughly 1 in 16 ids loses a nibble).
  // Both sides go through canonicalRequestId so the map lookup finds
  // the twin for that class of rows.
  const bySubgraph = new Map(subgraphActivities.map((a) => [canonicalRequestId(a.requestId), a]));
  const merged: Activity[] = fromMechAnalytics.map((a) => {
    const twin = bySubgraph.get(canonicalRequestId(a.requestId));
    if (!twin) return a;
    return {
      ...a,
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
    degraded: failedShards > 0,
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
  mechAddress?: string;
  deliveryMech?: string;
  sortDirection?: 'asc' | 'desc';
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

// ISO -> unix-seconds-string so the subgraph-side sortActivities
// (which does Number(...)) stays interchangeable.
const isoToUnixSecondsString = (iso: string | null): string =>
  iso ? String(Math.floor(new Date(iso).getTime() / 1000)) : '';

// mech-analytics stores the token identifier separately from the raw
// amount. Map it to the Activity.feeUnit enum so formatPayment
// picks the right decimals + label instead of the legacy
// native-only branch (parseToEth) that would render USDC as
// "0.000000000001 xDAI".
const mapPaymentToFee = (
  paymentType: string | null,
  deliveryRate: string | null,
): Pick<Activity, 'feeUnit' | 'feeRaw' | 'finalFeeUSD'> => {
  if (deliveryRate === null) {
    return { feeUnit: null, feeRaw: null, finalFeeUSD: null };
  }
  switch (paymentType) {
    case 'native':
      return { feeUnit: 'NATIVE', feeRaw: deliveryRate, finalFeeUSD: null };
    case 'usdc':
      // USDC is 6-decimal micro-USDC on the wire. Small amounts
      // (< 2^53 / 1e6 ≈ $9 billion) fit safely in float53, so a
      // direct divide is safe here. formatPayment reads finalFeeUSD
      // for the USDC branch and prints it as $X.XX.
      return {
        feeUnit: 'USDC',
        feeRaw: deliveryRate,
        finalFeeUSD: (Number(deliveryRate) / 1e6).toFixed(2),
      };
    case 'nvm_subscription':
      return { feeUnit: 'CREDITS', feeRaw: deliveryRate, finalFeeUSD: null };
    default:
      // Unknown payment_type: leave the fee fields empty so the
      // modal drops the Payment row rather than mislabelling.
      return { feeUnit: null, feeRaw: null, finalFeeUSD: null };
  }
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
