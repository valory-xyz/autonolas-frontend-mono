import { mergeServiceActivity } from 'common-util/graphql/service-activity';

type Address = `0x${string}`;

type TransactionHash = `0x${string}`;

export type Request = {
  id: string;
  blockTimestamp: string;
  transactionHash: TransactionHash;
  sender: {
    id: Address;
  };
  mechRequest: {
    ipfsHash: string;
  };
  marketplaceRequest: {
    ipfsHashBytes: string;
  };
  deliveries: {
    mech: Address;
    transactionHash: TransactionHash;
    blockTimestamp: string;
    marketplaceDelivery: {
      ipfsHashBytes: string;
      deliveryRate?: string;
    };
    mechDelivery: {
      ipfsHash: string;
    };
  }[];
};

export type Delivery = {
  id: string;
  mech: Address;
  blockTimestamp: string;
  transactionHash: TransactionHash;
  mechDelivery: {
    ipfsHash: string;
  };
  marketplaceDelivery: {
    ipfsHashBytes: string;
    deliveryRate?: string;
  };
  request: {
    id: string;
    mechRequest: {
      ipfsHash: string;
    };
    marketplaceRequest: {
      ipfsHashBytes: string;
    };
    sender: {
      id: Address;
    };
    blockTimestamp: string;
    transactionHash: TransactionHash;
  };
};

export type Service = {
  id: string;
  totalRequests: number;
  totalDeliveries: number;
  metadata: string;
};

export type ServiceActivity = ReturnType<typeof mergeServiceActivity>;
