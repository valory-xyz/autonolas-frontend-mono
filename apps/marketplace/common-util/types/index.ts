import { mergeServiceActivity } from 'common-util/graphql/service-activity';
import { mergeServicesDetails } from 'common-util/graphql/services';

type Address = `0x${string}`;

type TransactionHash = `0x${string}`;

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
    deliveryRate?: string;
  };
};

export type Delivery = {
  id: string;
  ipfsHash: string;
  mech: Address;
  blockTimestamp: string;
  transactionHash: TransactionHash;
  request: {
    id: string;
    ipfsHash: string;
    sender: {
      id: Address;
    };
    blockTimestamp: string;
    transactionHash: TransactionHash;
  };
  deliveryRate?: string;
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
