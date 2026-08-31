import type { Activity } from 'common-util/graphql/service-activity';
import { iterateScoredRows, iterateUnscoredRows } from './client';
import type { ScoredRow } from './types';

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
 * Fetch three row families to match the subgraph path's envelope:
 *
 *  - scored-rows keyed on requester → Demand (delivered)
 *  - unscored-rows keyed on requester → Demand (undelivered / in-flight)
 *  - scored-rows keyed on mech_address → Supply (the service's own mechs)
 */
export const getServiceActivityFromMechAnalytics = async ({
  chainId,
  serviceId,
  multisigs,
  mechAddresses,
  signal,
}: {
  chainId: number;
  serviceId: string;
  multisigs: string[];
  mechAddresses: string[];
  signal?: AbortSignal;
}): Promise<MechAnalyticsServiceActivity> => {
  const [demandScored, demandUnscored, supplyScored] = await Promise.all([
    Promise.all(
      multisigs.map((multisig) =>
        fetchCapped('scored-rows', { chainId, requester: multisig, signal }),
      ),
    ),
    Promise.all(
      multisigs.map((multisig) =>
        fetchCapped('unscored-rows', { chainId, requester: multisig, signal }),
      ),
    ),
    Promise.all(
      mechAddresses.map((mechAddress) =>
        fetchCapped('scored-rows', { chainId, mechAddress, signal }),
      ),
    ),
  ]);

  const hasMore =
    demandScored.some((r) => r.hasMore) ||
    demandUnscored.some((r) => r.hasMore) ||
    supplyScored.some((r) => r.hasMore);

  const activities = [
    ...demandScored.flatMap((r) => r.rows).map((row) => mapRowToActivity(row, 'Demand')),
    ...demandUnscored.flatMap((r) => r.rows).map((row) => mapRowToActivity(row, 'Demand')),
    ...supplyScored.flatMap((r) => r.rows).map((row) => mapRowToActivity(row, 'Supply')),
  ];

  // Descending on the max of delivered/requested timestamp so
  // undelivered requests still sort against a comparable clock.
  activities.sort(byActivityTimestampDescending);

  return { id: serviceId, activities, hasMore };
};

const fetchCapped = async (
  endpoint: 'scored-rows' | 'unscored-rows',
  params: { chainId: number; requester?: string; mechAddress?: string; signal?: AbortSignal },
): Promise<{ rows: ScoredRow[]; hasMore: boolean }> => {
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
  deliveredBy: row.mech_address ?? '',
  deliveryTransactionHash: row.delivery_tx_hash ?? '',
  deliveryBlockTimestamp: isoToUnixSecondsString(row.delivered_at),
  source: row.source ?? null,
  ipfsRetrievable: row.ipfs_retrievable,
  // See note on delivery_rate's unit-per-payment-model caveat in the
  // reviewer thread; better than dropping the payment row entirely.
  payment: row.delivery_rate,
  deliveryRate: row.delivery_rate,
});

const activityTimestamp = (a: Activity): number =>
  Math.max(Number(a.deliveryBlockTimestamp) || 0, Number(a.requestBlockTimestamp) || 0);

const byActivityTimestampDescending = (a: Activity, b: Activity): number =>
  activityTimestamp(b) - activityTimestamp(a);
