import { Request, Delivery } from 'common-util/types';
import { MARKETPLACE_SUBGRAPH_CLIENTS } from './index';

type ActivityType = 'Demand' | 'Supply';

export type Activity = {
  activityType: ActivityType;
  requestId: string;
  requestIpfsHash: string;
  requestBlockTimestamp: string;
  requestedBy: string;
  requestTransactionHash: string;
  deliveryIpfsHash: string;
  deliveredBy: string;
  deliveryTransactionHash: string;
  deliveryBlockTimestamp: string;
  payment?: string | null;
};

const LIMIT = 1_000;
const LEGACY_DELIVERY_PAYMENT_WEI = '10000000000000000';

export const getQueryForServiceActivity = ({ serviceId }: { serviceId: string }) => {
  return `
  {
    delivers (where: {service_: {id: "${serviceId}"}}, first: ${LIMIT}, orderBy: blockTimestamp, orderDirection: desc) {
      id
      mech
      blockTimestamp
      transactionHash
      service {
        id
      }
      mechDelivery {
        ipfsHash
      }
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
        mechRequest {
          ipfsHash
        }
        marketplaceRequest {
          ipfsHashBytes
        }
      }
    }

    requests (where: {service_: {id: "${serviceId}"}}, first: ${LIMIT}, orderBy: blockTimestamp, orderDirection: desc) {
      id
      mechRequest {
        ipfsHash
      }
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
        mechDelivery {
          ipfsHash
        }
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
  chainId: keyof typeof MARKETPLACE_SUBGRAPH_CLIENTS;
  serviceId: string;
}) => {
  const client = MARKETPLACE_SUBGRAPH_CLIENTS[chainId];

  const query = getQueryForServiceActivity({ serviceId });
  const response: Omit<ActivityResponse, 'id'> = await client.request(query);
  const serviceActivity = mergeServiceActivity({ id: serviceId, ...response });
  return serviceActivity;
};
