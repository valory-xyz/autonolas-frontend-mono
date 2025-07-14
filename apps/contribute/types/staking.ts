import { Address } from 'viem';

export type Checkpoint = {
  id: string;
  epoch: number;
  contractAddress: Address;
  rewards: string[];
  serviceIds: string[];
  blockTimestamp: number;
};
