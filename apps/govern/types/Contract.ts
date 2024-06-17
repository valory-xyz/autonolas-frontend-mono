import { Address } from 'viem';

export type Metadata = {
  name: string;
  description: string;
};

export type Weight = { percentage: number; value: number };

export type StakingContract = {
  address: Address;
  chainId: number;
  metadata: Metadata;
  currentWeight: Weight;
  nextWeight: Weight;
};
