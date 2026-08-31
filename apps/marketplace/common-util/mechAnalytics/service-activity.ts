import type { Activity } from 'common-util/graphql/service-activity';
import { fetchAllScoredRows } from './client';
import type { ScoredRow } from './types';

export type MechAnalyticsServiceActivity = {
  id: string;
  activities: Activity[];
};

export const getServiceActivityFromMechAnalytics = async ({
  chainId,
  serviceId,
  multisigs,
  signal,
}: {
  chainId: number;
  serviceId: string;
  multisigs: string[];
  signal?: AbortSignal;
}): Promise<MechAnalyticsServiceActivity> => {
  if (multisigs.length === 0) {
    return { id: serviceId, activities: [] };
  }

  const perMultisig = await Promise.all(
    multisigs.map((multisig) =>
      fetchAllScoredRows({
        chainId,
        requester: multisig.toLowerCase(),
        signal,
      }),
    ),
  );

  const activities = perMultisig.flat().map(mapScoredRowToActivity);
  activities.sort(byDeliveredAtDescending);

  return { id: serviceId, activities };
};

// Timestamps converted ISO -> unix-seconds-string so `sortActivities`
// on the subgraph side (which does `Number(...)`) stays interchangeable.
const mapScoredRowToActivity = (row: ScoredRow): Activity => {
  const requestedAtSeconds = String(Math.floor(new Date(row.requested_at).getTime() / 1000));
  const deliveredAtSeconds = String(Math.floor(new Date(row.delivered_at).getTime() / 1000));

  return {
    activityType: 'Demand',
    requestId: row.request_id,
    requestIpfsHash: row.request_ipfs_hash ?? '',
    requestBlockTimestamp: requestedAtSeconds,
    requestedBy: row.requester,
    requestTransactionHash: row.request_tx_hash ?? '',
    deliveryIpfsHash: row.delivery_ipfs_hash ?? '',
    deliveredBy: row.mech_address,
    deliveryTransactionHash: row.delivery_tx_hash ?? '',
    deliveryBlockTimestamp: deliveredAtSeconds,
    source: row.source ?? null,
    ipfsRetrievable: row.ipfs_retrievable,
    deliveryRate: row.delivery_rate,
  };
};

const byDeliveredAtDescending = (a: Activity, b: Activity): number =>
  Number(b.deliveryBlockTimestamp) - Number(a.deliveryBlockTimestamp);
