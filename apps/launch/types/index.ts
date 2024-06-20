import { Address } from 'viem';

export type MyStakingContract = {
  id: Address;
  chainId: number;
  name: string;
  description: string;
  template: string;
  isNominated: boolean;
};
