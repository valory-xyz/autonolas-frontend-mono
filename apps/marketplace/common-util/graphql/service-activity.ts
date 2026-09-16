import { Request, Delivery, FeeUnit } from 'common-util/types';
import { MARKETPLACE_SUBGRAPH_CLIENTS, type MarketplaceSubgraphChainId } from './index';
import { getSubgraphDialect, omitOnSquid, type SubgraphDialect } from './dialect';

type ActivityType = 'Demand' | 'Supply';

export type Activity = {
  activityType: ActivityType;
  requestId: string;
  /** Undefined when neither the legacy nor the marketplace payload carries a hash. */
  requestIpfsHash: string | undefined;
  requestBlockTimestamp: string;
  requestedBy: string;
  requestTransactionHash: string;
  /** Undefined when neither the legacy nor the marketplace payload carries a hash. */
  deliveryIpfsHash: string | undefined;
  deliveredBy: string;
  deliveryTransactionHash: string;
  deliveryBlockTimestamp: string;
  payment?: string | null;
  feeUSD?: string | null;
  finalFeeUSD?: string | null;
  feeRaw?: string | null;
  feeUnit?: FeeUnit | null;
  // Populated only by the mech-analytics reader path.
  source?: string | null;
  ipfsRetrievable?: boolean;
  deliveryRate?: string | null;
};

const LIMIT = 1_000;
// 0.01 xDAI. Fixed fee legacy pre-marketplace AgentMechs charged.
export const LEGACY_DELIVERY_PAYMENT_WEI = '10000000000000000';

/**
 * Per-dialect fragments. The squid has no legacy (pre-marketplace) mech entities,
 * so `mechRequest` / `mechDelivery` are not requested there — every Robinhood
 * request and delivery carries its payload in `*.ipfsHashBytes`.
 *
 * The service id is the `$serviceId` variable (ID on The Graph, String on the
 * squid), passed with the request rather than interpolated.
 */
const activityArgs = (dialect: SubgraphDialect) =>
  dialect === 'squid'
    ? `where: {service: {id_eq: $serviceId}}, limit: ${LIMIT}, orderBy: blockTimestamp_DESC`
    : `where: {service_: {id: $serviceId}}, first: ${LIMIT}, orderBy: blockTimestamp, orderDirection: desc`;

const mechRequestFields = (dialect: SubgraphDialect) =>
  omitOnSquid(dialect, 'mechRequest { ipfsHash }');

const mechDeliveryFields = (dialect: SubgraphDialect) =>
  omitOnSquid(dialect, 'mechDelivery { ipfsHash }');

export const getQueryForServiceActivity = (dialect: SubgraphDialect) => {
  return `
  query ServiceActivity($serviceId: ${dialect === 'squid' ? 'String!' : 'ID!'}) {
    delivers (${activityArgs(dialect)}) {
      id
      mech
      blockTimestamp
      transactionHash
      service {
        id
      }
      ${mechDeliveryFields(dialect)}
      marketplaceDelivery {
        ipfsHashBytes
        deliveryRate
      }
      request {
        id
        blockTimestamp
        transactionHash
        sender {
          id
        }
        feeUSD
        finalFeeUSD
        feeRaw
        feeUnit
        ${mechRequestFields(dialect)}
        marketplaceRequest {
          ipfsHashBytes
        }
      }
    }

    requests (${activityArgs(dialect)}) {
      id
      feeUSD
      finalFeeUSD
      feeRaw
      feeUnit
      ${mechRequestFields(dialect)}
      marketplaceRequest {
        ipfsHashBytes
      }
      blockTimestamp
      transactionHash
      sender {
        id
      }
      deliveries {
        mech
        transactionHash
        blockTimestamp
        marketplaceDelivery {
          ipfsHashBytes
          deliveryRate
        }
        ${mechDeliveryFields(dialect)}
      }
    }
  }
  `;
};

const convertRequestToActivity = (request: Request): Activity => {
  const {
    id: requestId,
    mechRequest,
    marketplaceRequest,
    sender,
    deliveries,
    blockTimestamp: requestBlockTimestamp,
    transactionHash: requestTransactionHash,
    feeUSD,
    finalFeeUSD,
    feeRaw,
    feeUnit,
  } = request || {};
  const {
    mech: deliveredBy,
    transactionHash: deliveryTransactionHash,
    blockTimestamp: deliveryBlockTimestamp,
    marketplaceDelivery,
    mechDelivery,
  } = deliveries?.[0] || {};
  const { id: requestedBy } = sender || {};

  const requestIpfsHash = mechRequest?.ipfsHash || marketplaceRequest?.ipfsHashBytes;
  const deliveryIpfsHash = mechDelivery?.ipfsHash || marketplaceDelivery?.ipfsHashBytes;

  const isDeliveredByMech = !!mechDelivery;
  const payment = isDeliveredByMech
    ? LEGACY_DELIVERY_PAYMENT_WEI
    : marketplaceDelivery?.deliveryRate || null;

  return {
    activityType: 'Demand',
    requestId,
    requestIpfsHash,
    requestBlockTimestamp,
    requestedBy,
    requestTransactionHash,
    deliveryIpfsHash,
    deliveredBy,
    deliveryTransactionHash,
    deliveryBlockTimestamp,
    payment,
    feeUSD: feeUSD || null,
    finalFeeUSD: finalFeeUSD || null,
    feeRaw: feeRaw || null,
    feeUnit: feeUnit || null,
  };
};

const convertDeliveryToActivity = (delivery: Delivery): Activity => {
  const {
    mech: deliveredBy,
    blockTimestamp: deliveryBlockTimestamp,
    transactionHash: deliveryTransactionHash,
    request,
    marketplaceDelivery,
    mechDelivery,
  } = delivery || {};
  const {
    id: requestId,
    mechRequest,
    marketplaceRequest,
    sender,
    blockTimestamp: requestBlockTimestamp,
    transactionHash: requestTransactionHash,
    feeUSD,
    finalFeeUSD,
    feeRaw,
    feeUnit,
  } = request || {};
  const { id: requestedBy } = sender || {};

  const requestIpfsHash = mechRequest?.ipfsHash || marketplaceRequest?.ipfsHashBytes;
  const deliveryIpfsHash = mechDelivery?.ipfsHash || marketplaceDelivery?.ipfsHashBytes;

  const isDeliveredByMech = !!mechDelivery;
  const payment = isDeliveredByMech
    ? LEGACY_DELIVERY_PAYMENT_WEI
    : marketplaceDelivery?.deliveryRate || null;

  return {
    activityType: 'Supply',
    requestId,
    requestIpfsHash,
    requestBlockTimestamp,
    requestedBy,
    requestTransactionHash,
    deliveryIpfsHash,
    deliveredBy,
    deliveryTransactionHash,
    deliveryBlockTimestamp,
    payment,
    feeUSD: feeUSD || null,
    finalFeeUSD: finalFeeUSD || null,
    feeRaw: feeRaw || null,
    feeUnit: feeUnit || null,
  };
};

const sortActivities = (activities: Activity[]) => {
  return activities.sort((activityA, activityB) => {
    // Get the relevant timestamp for each activity
    const getTimestamp = (activity: Activity) => {
      return activity.activityType === 'Demand'
        ? Number(activity.requestBlockTimestamp)
        : Number(activity.deliveryBlockTimestamp);
    };

    const timestampA = getTimestamp(activityA);
    const timestampB = getTimestamp(activityB);

    // Sort in descending order (latest timestamp first)
    return timestampB - timestampA;
  });
};

type ActivityResponse = {
  id: string;
  requests: Request[];
  delivers: Delivery[];
};

const mergeServiceActivity = (serviceActivity: ActivityResponse) => {
  const { id } = serviceActivity || {};
  const { requests: requestsFromMM, delivers: deliveriesFromMM } = serviceActivity || {};

  const requestActivitiesFromMM = (requestsFromMM || [])?.map(convertRequestToActivity);
  const deliveryActivitiesFromMM = (deliveriesFromMM || [])?.map(convertDeliveryToActivity);
  const activities = [...requestActivitiesFromMM, ...deliveryActivitiesFromMM];
  const sortedActivities = sortActivities(activities);

  return {
    id,
    activities: sortedActivities,
  };
};

export const getServiceActivityFromMarketplaceSubgraph = async ({
  chainId,
  serviceId,
}: {
  chainId: MarketplaceSubgraphChainId;
  serviceId: string;
}) => {
  const client = MARKETPLACE_SUBGRAPH_CLIENTS[chainId];

  const query = getQueryForServiceActivity(getSubgraphDialect(chainId));
  const response: Omit<ActivityResponse, 'id'> = await client.request(query, { serviceId });
  const serviceActivity = mergeServiceActivity({ id: serviceId, ...response });
  return serviceActivity;
};
