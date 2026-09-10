import { Activity } from 'common-util/graphql/service-activity';

type Address = `0x${string}`;

type TransactionHash = `0x${string}`;

export type FeeUnit = 'NATIVE' | 'TOKEN' | 'USDC' | 'CREDITS';

export type Request = {
  id: string;
  blockTimestamp: string;
  transactionHash: TransactionHash;
  sender: {
    id: Address;
  };
  feeUSD?: string | null;
  finalFeeUSD?: string | null;
  feeRaw?: string | null;
  feeUnit?: FeeUnit | null;
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
      deliveryRate?: string | null;
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
    deliveryRate?: string | null;
  };
  request: {
    id: string;
    feeUSD?: string | null;
    finalFeeUSD?: string | null;
    feeRaw?: string | null;
    feeUnit?: FeeUnit | null;
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
  mechAddresses: string[];
};

export type ServiceActivity = {
  id: string;
  activities: Activity[];
  // True when at least one mech-analytics shard hit its per-shard
  // page cap on the descending scan (i.e. this service has more
  // recent activity than the tab could load in one request). FE
  // surfaces a "some older rows truncated" hint. Absent on the
  // subgraph path.
  hasMore?: boolean;
  // True when at least one mech-analytics shard failed and its
  // rows are missing from the response. API layer uses this to
  // shorten the CDN TTL so a transient blip doesn't stick.
  // Absent on the subgraph path.
  degraded?: boolean;
};
