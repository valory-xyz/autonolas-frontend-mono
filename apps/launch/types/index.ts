import { Address } from 'viem';

export type MyStakingContract = {
  id: Address;
  chainId: number;
  name: string;
  description: string;
  template: string;
  nominationStatus: NominationStatus;
};

/**
 * Whether a staking contract is a VoteWeighting nominee on mainnet. `unknown` means the nominee
 * read failed: never treat it as not nominated, or a Nominate action would be offered for a
 * contract that may already be one.
 */
export type NominationStatus = 'loading' | 'unknown' | 'nominated' | 'notNominated';

export type ErrorType = { name?: string; message: string; transactionHash?: string } | null;
