import { ethers } from 'ethers';

import { getDelegateContributeContract } from 'common-util/Contracts';

/**
 * balanceOf veOlas contract - it is the amount of veolas locked
 */
export const fetchVotingPower = async ({ account }: { account: string }) => {
  const contract = getDelegateContributeContract();
  const votingPower = await contract.methods.votingPower(account).call();
  return votingPower;
};

export const checkVotingPower = async (
  account: string,
  thresholdInWei: string,
): Promise<boolean> => {
  const votingPower = await fetchVotingPower({ account });
  const bNVotingPower = ethers.toBigInt(votingPower);
  const thresholdInBn = ethers.toBigInt(thresholdInWei);
  return bNVotingPower >= thresholdInBn;
};
