import { Abi, Address } from 'viem';

export type Contract = {
  contractName: string;
  addresses: Record<number, Address>;
  abi: Abi;
};
