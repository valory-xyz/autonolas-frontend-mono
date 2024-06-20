import { Address } from "viem";

export type MyStakingContract = {
  id: Address;
  name: string;
  description: string;
  template: string;
  isNominated: boolean;
};
