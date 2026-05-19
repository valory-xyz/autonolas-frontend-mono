import { readContract } from '@wagmi/core';
import { ethers } from 'ethers';
import { Address } from 'viem';

import { delegateContributeParams } from 'common-util/Contracts/params';
import { wagmiConfig } from 'components/Login/config';

/** Voting power on the DelegateContribute contract for the given account. */
export const fetchVotingPower = async ({ account }: { account: string }) => {
  return readContract(wagmiConfig, {
    ...delegateContributeParams,
    functionName: 'votingPower',
    args: [account as Address],
  });
};

export const checkVotingPower = async (
  account: string,
  thresholdInWei: string,
): Promise<boolean> => {
  const votingPower = await fetchVotingPower({ account });
  const bNVotingPower = ethers.toBigInt(votingPower as bigint | string);
  const thresholdInBn = ethers.toBigInt(thresholdInWei);
  return bNVotingPower >= thresholdInBn;
};
