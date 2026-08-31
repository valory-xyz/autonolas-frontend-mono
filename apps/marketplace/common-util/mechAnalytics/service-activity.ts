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

export type MechAnalyticsServiceActivity = {
  id: string;
  activities: Activity[];
  // Soft "we truncated at the page cap" hint (per-multisig).
  hasMore: boolean;
};

// At DEFAULT_LIMIT=1000 rows/page this caps each endpoint fetch at 5000
// rows / ~2.5MB. The activity route sums N fetches (multisigs +
// mech addresses), so total response size scales linearly with the
// service's history.
const ACTIVITY_MAX_PAGES = 5;

type ActivityType = Activity['activityType'];

/**
 * Fetch three row families to approximate the subgraph path's envelope:
 *
 *  - scored-rows keyed on requester → Demand (delivered).
 *  - unscored-rows keyed on requester → shell / abandoned requests.
 *    Note: mech-analytics deliberately holds undelivered requests out
 *    of per_request_scores until they are >24h old, so a freshly-fired
 *    in-flight request will NOT appear here for its first day. F10
 *    tracks the fix.
 *  - scored-rows keyed on mech_address → "requests routed to this
 *    mech" (i.e. priority-mech assignments). Note: this is NOT
 *    "requests this mech delivered" — mech-analytics only projects
 *    ``priority_mech`` into ``mech_address``, not ``delivery_mech``.
 *    Under the marketplace's non-priority delivery path (any registered
 *    mech may deliver once the priority window lapses), the two sets
 *    diverge. F9 tracks upstreaming a ``delivery_mech`` projection to
 *    mech-analytics; until then we don't claim ``deliveredBy`` on
 *    mech-analytics rows.
 */
export const getServiceActivityFromMechAnalytics = async ({
  chainId,
  serviceId,
  multisigs,
  mechAddresses,
  // F10: the subgraph-sourced activities are unioned in so a
  // freshly-fired request keeps rendering during the ~24h window that
  // mech-analytics holds it out of both scored-rows and unscored-rows.
  // Deduped by requestId, mech-analytics wins for delivered rows (it
  // carries the tx hashes / IPFS CIDs the subgraph doesn't project).
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
      safe('scored-rows', { chainId, requester: multisig, signal }),
    ),
    mapWithConcurrency(multisigs, ACTIVITY_FETCH_CONCURRENCY, (multisig) =>
      safe('unscored-rows', { chainId, requester: multisig, signal }),
    ),
    mapWithConcurrency(mechAddresses, ACTIVITY_FETCH_CONCURRENCY, (mechAddress) =>
      safe('scored-rows', { chainId, mechAddress, signal }),
    ),
  ]);

  const hasMore =
    demandScored.some((r) => r.hasMore) ||
    demandUnscored.some((r) => r.hasMore) ||
    supplyScored.some((r) => r.hasMore);

  const fromMechAnalytics = [
    ...demandScored.flatMap((r) => r.rows).map((row) => mapRowToActivity(row, 'Demand')),
    ...demandUnscored.flatMap((r) => r.rows).map((row) => mapRowToActivity(row, 'Demand')),
    ...supplyScored.flatMap((r) => r.rows).map((row) => mapRowToActivity(row, 'Supply')),
  ];

  // Union subgraph rows for the pending-tail gap. Dedup by requestId
  // with mech-analytics winning — its rows carry tx hashes / IPFS CIDs
  // the subgraph doesn't project.
  const seen = new Set(fromMechAnalytics.map((a) => a.requestId));
  const fromSubgraph = subgraphActivities.filter((a) => !seen.has(a.requestId));
  const activities = [...fromMechAnalytics, ...fromSubgraph];

  activities.sort(byActivityTimestampDescending);

  return { id: serviceId, activities, hasMore };
};

type FetchParams = {
  chainId: number;
  requester?: string;
  mechAddress?: string;
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
  // not the mech that actually delivered. Setting this to that
  // priority address on delivered rows would misattribute deliveries
  // in the non-priority path. Left blank until mech-analytics
  // projects ``mech_responses.delivery_mech``.
  deliveredBy: '',
  deliveryTransactionHash: row.delivery_tx_hash ?? '',
  deliveryBlockTimestamp: isoToUnixSecondsString(row.delivered_at),
  source: row.source ?? null,
  ipfsRetrievable: row.ipfs_retrievable,
  // Intentionally NOT setting `payment`. formatPayment's legacy branch
  // runs parseToEth (hardcoded 18 decimals) with a chain-native label,
  // so a USDC-paid request at "1000000" (1 USDC in 6-decimal wei)
  // renders as "0.000000000001 xDAI" — a plausible-looking number
  // that reads as real. Blank is more honest than mislabelled until
  // mech-analytics surfaces a payment-token hint on ScoredRow.
  // The raw value stays on `deliveryRate` for future consumption.
  deliveryRate: row.delivery_rate,
});

const activityTimestamp = (a: Activity): number =>
  Math.max(Number(a.deliveryBlockTimestamp) || 0, Number(a.requestBlockTimestamp) || 0);

const byActivityTimestampDescending = (a: Activity, b: Activity): number =>
  activityTimestamp(b) - activityTimestamp(a);
