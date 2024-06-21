import { Address } from 'viem';

export type MyStakingContract = {
  id: Address;
  chainId: number;
  name: string;
  description: string;
  template: string;
  isNominated: boolean;
};

export type ErrorType = { message: string; transactionHash?: string } | null;
