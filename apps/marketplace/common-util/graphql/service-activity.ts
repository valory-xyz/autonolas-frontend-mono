import { Request, Delivery } from 'common-util/types';
import { LEGACY_MECH_SUBGRAPH_CLIENT, MM_GRAPHQL_CLIENTS } from './index';

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

export const getQueryForServiceActivity = ({
  serviceId,
  includeDeliveryRate,
}: {
  serviceId: string;
  includeDeliveryRate?: boolean;
}) => {
  const deliveryRateLine = includeDeliveryRate ? '      deliveryRate\n' : '';
  const nestedDeliveryRateLine = includeDeliveryRate ? '          deliveryRate\n' : '';
  const nestedDeliveryBlock = includeDeliveryRate
    ? `        delivery {\n${nestedDeliveryRateLine}        }\n`
    : '';

  return `
  {
    delivers (where: {service_: {id: "${serviceId}"}}, first: ${LIMIT}, orderBy: blockTimestamp, orderDirection: desc) {
      id
      ipfsHash
      mech
      blockTimestamp
      transactionHash
${deliveryRateLine}
      service {
        id
      }
      request {
        ipfsHash
        blockTimestamp
        transactionHash
        sender {
          id
        }
${nestedDeliveryBlock}
      }
    }

    requests (where: {service_: {id: "${serviceId}"}}, first: ${LIMIT}, orderBy: blockTimestamp, orderDirection: desc) {
      id
      ipfsHash
      blockTimestamp
      transactionHash
      sender {
        id
      }
      delivery {
        ipfsHash
        mech
        transactionHash
        blockTimestamp
${nestedDeliveryRateLine}
      }
    }
  }
  `;
};

const convertRequestToActivity = (request: Request): Activity => {
  const {
    id: requestId,
    ipfsHash: requestIpfsHash,
    sender,
    delivery,
    blockTimestamp: requestBlockTimestamp,
    transactionHash: requestTransactionHash,
  } = request || {};
  const {
    ipfsHash: deliveryIpfsHash,
    mech: deliveredBy,
    transactionHash: deliveryTransactionHash,
    blockTimestamp: deliveryBlockTimestamp,
    deliveryRate,
  } = delivery || {};
  const { id: requestedBy } = sender || {};

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
    payment: deliveryRate ?? null,
  };
};

const convertDeliveryToActivity = (delivery: Delivery): Activity => {
  const {
    id: requestId,
    ipfsHash: deliveryIpfsHash,
    mech: deliveredBy,
    blockTimestamp: deliveryBlockTimestamp,
    transactionHash: deliveryTransactionHash,
    request,
    deliveryRate,
  } = delivery || {};
  const {
    ipfsHash: requestIpfsHash,
    sender,
    blockTimestamp: requestBlockTimestamp,
    transactionHash: requestTransactionHash,
  } = request || {};
  const { id: requestedBy } = sender || {};

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
    payment: deliveryRate ?? null,
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

export const mergeServiceActivity = (
  activityFromMM: ActivityResponse,
  activityFromLegacy: ActivityResponse,
) => {
  const { id } = activityFromMM || {};
  const { requests: requestsFromMM, delivers: deliveriesFromMM } = activityFromMM || {};
  const { requests: requestsFromLegacy, delivers: deliveriesFromLegacy } = activityFromLegacy || {};

  const requestActivitiesFromMM = (requestsFromMM || [])?.map(convertRequestToActivity);
  const requestActivitiesFromLegacy = (requestsFromLegacy || [])?.map(convertRequestToActivity);

  const deliveryActivitiesFromMM = (deliveriesFromMM || [])?.map(convertDeliveryToActivity);
  const deliveryActivitiesFromLegacy = (deliveriesFromLegacy || [])?.map(convertDeliveryToActivity);

  const activities = [
    ...requestActivitiesFromMM,
    ...requestActivitiesFromLegacy,
    ...deliveryActivitiesFromMM,
    ...deliveryActivitiesFromLegacy,
  ];

  const sortedActivities = sortActivities(activities);

  return {
    id,
    activities: sortedActivities,
  };
};

export const getServiceActivityFromMMSubgraph = async ({
  chainId,
  serviceId,
}: {
  chainId: keyof typeof MM_GRAPHQL_CLIENTS;
  serviceId: string;
}) => {
  const client = MM_GRAPHQL_CLIENTS[chainId];

  const query = getQueryForServiceActivity({ serviceId, includeDeliveryRate: true });
  const response: Omit<ActivityResponse, 'id'> = await client.request(query);
  return { id: serviceId, ...response };
};

export const getServiceActivityFromLegacyMechSubgraph = async ({
  serviceId,
}: {
  serviceId: string;
}) => {
  const query = getQueryForServiceActivity({ serviceId });
  const response: Omit<ActivityResponse, 'id'> = await LEGACY_MECH_SUBGRAPH_CLIENT.request(query);
  return { id: serviceId, ...response };
};
