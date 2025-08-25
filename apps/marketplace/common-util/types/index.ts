import { mergeServiceActivity } from 'common-util/graphql/service-activity';
import { mergeServicesDetails } from 'common-util/graphql/services';
import { MARKETPLACE_SUPPORTED_NETWORKS } from 'util/constants';

type Address = `0x${string}`;

type TransactionHash = `0x${string}`;

export type MarketplaceSupportedNetwork =
  (typeof MARKETPLACE_SUPPORTED_NETWORKS)[keyof typeof MARKETPLACE_SUPPORTED_NETWORKS];

export type Request = {
  id: string;
  ipfsHash: string;
  blockTimestamp: string;
  transactionHash: TransactionHash;
  sender: {
    id: Address;
  };
  delivery: {
    ipfsHash: string;
    mech: Address;
    transactionHash: TransactionHash;
    blockTimestamp: string;
  };
};

export type Delivery = {
  id: string;
  ipfsHash: string;
  mech: Address;
  sender: Address;
  blockTimestamp: string;
  transactionHash: TransactionHash;
  request: {
    id: string;
    ipfsHash: string;
    blockTimestamp: string;
    transactionHash: TransactionHash;
  };
};

export type Service = {
  id: string;
  totalRequests: number;
  totalDeliveries: number;
  metadata: {
    metadata: string;
  };
  requests: Request[];
  deliveries: Delivery[];
};

export type ServiceData = ReturnType<typeof mergeServicesDetails>;

export type ServiceActivity = ReturnType<typeof mergeServiceActivity>;
