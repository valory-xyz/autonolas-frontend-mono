import { ethers } from 'ethers';

import { ethersToWei, formatToEth } from 'common-util/functions';
import { ModuleDetails } from 'store/types';
import { VEOLAS_QUORUM } from 'util/constants';

const quorumInWei = ethersToWei(`${VEOLAS_QUORUM}`);

/**
 * check if the current proposal has enough veOLAS to be executed
 */
export const getCurrentProposalInfo = (
  proposal: ModuleDetails['scheduled_tweet']['tweets'][number],
) => {
  /**
   * voter: {
   *  address: '0x123',
   *  signature: '0x789',
   *  votingPower: '1000000000000000000000000',
   * }
   */
  const totalVeolasInWei = proposal.voters.reduce((acc, voter) => {
    const currentVeOlasInWei = ethersToWei(`${voter?.votingPower || '0'}`);
    return acc + ethers.toBigInt(currentVeOlasInWei);
  }, 0n);

  // check if voters have reached the quorum
  const isQuorumAchieved = totalVeolasInWei >= quorumInWei;

  const remainingVeolasForApprovalInEth = formatToEth(
    ethers.toBigInt(quorumInWei) - ethers.toBigInt(totalVeolasInWei),
  );

  const totalVeolasInvestedInPercentage = ((totalVeolasInWei * 100n) / quorumInWei).toString();

  const isProposalVerified = proposal?.proposer?.verified;

  const votersAddress = proposal.voters.map((voter) => voter.address);

  return {
    isQuorumAchieved,
    totalVeolasInEth: formatToEth(totalVeolasInWei),
    remainingVeolasForApprovalInEth,
    totalVeolasInvestedInPercentage,
    isProposalVerified,
    votersAddress,
  };
};
