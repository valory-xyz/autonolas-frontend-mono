import { Address } from 'viem';

export type Metadata = {
  name: string;
  description: string;
};

export type StakingContract = {
  key: Address;
  address: Address;
  chainId: number;
  metadata: Metadata;
  availableSlots: number;
  maxSlots: number;
  apy: number;
  stakeRequired: string;
  availableOn: 'pearl' | 'quickstart' | 'optimusQuickstart' | null;
  minOperatingBalance: number | null;
  minOperatingBalanceToken: string | null;
  convertUsdToEth: boolean;
};
