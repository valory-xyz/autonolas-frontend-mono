import { Allocation, StakingContract, UserVotes } from 'types';
import { Address } from 'viem';

export const MAX_ALLOCATED_POWER = 10_000;

/**
 * BE stores and checks the user's limit (which is 10_000 = 100%)
 * every time we vote on a contract.
 *
 * Example:
 * The old user's votes are: [{2: 8000}, {3: 1000}, {5: 1000}] - the user's total vote is 10_000.
 * The new votes the user wants to apply are: [{1: 3000}, {2: 1000}, {5: 6000}]
 *
 * The first new vote is 3000, which exceeds the limit of 10,000, causing an Overflow error.
 * To prevent this, we need to reorder the old and new votes as follows:
 * [{3: 0}, {2: 1000}, {5: 6000}, {1: 3000}]
 *
 * First, we need to remove weights from the contracts that the user is no longer voting on.
 * Then, if the user votes on the same contracts as before, we should place the new weights,
 * sorted by ascending weight, at the same positions as the old votes, sorted by descending weight
 * (So the applied new weight is lower that the old one).
 * Finally, we can add the remaining new votes.
 */
export const getReorderedVotes = (
  allocations: Allocation[],
  userVotes: Record<string, UserVotes>,
  stakingContracts: StakingContract[],
) => {
  // Sort new allocation by ascending weights
  const sortedAllocations = [...allocations].sort((a, b) => a.weight - b.weight);
  // Sort old votes by descending weights
  const sortedOldVotes = [...Object.entries(userVotes)].sort(
    ([aKey, aValue], [bKey, bValue]) => bValue.current.power - aValue.current.power,
  );

  const newVotes: { address: Address; chainId: number; weight: string }[] = [];
  const resetVotes: { address: Address; chainId: number; weight: string }[] = [];

  // Start from old votes
  sortedOldVotes.forEach((oldVote) => {
    const [oldVoteAddress] = oldVote;

    const newVote = sortedAllocations.find((item) => item.address === oldVoteAddress);
    // If the user votes for the same contract they already voted on,
    // keep new weight value at the same position of resorted old votes
    if (newVote) {
      newVotes.push({
        address: newVote.address,
        chainId: newVote.chainId,
        weight: `${Math.floor(newVote.weight * 100)}`,
      });
    } else {
      // Otherwise we need to remove weight from that contract
      // before voting on the others contacts
      const chainId = stakingContracts.find((item) => item.address === oldVoteAddress)?.chainId;
      if (chainId) {
        // Use new array to keep the order
        resetVotes.push({ address: oldVoteAddress as Address, chainId, weight: '0' });
      }
    }
  });

  // Add old votes that we need to reset the power from
  newVotes.unshift(...resetVotes);

  // Add remaining new votes to the result
  sortedAllocations.forEach((newVote) => {
    if (newVotes.findIndex((item) => item.address === newVote.address) === -1) {
      newVotes.push({
        address: newVote.address,
        chainId: newVote.chainId,
        weight: `${Math.floor(newVote.weight * 100)}`,
      });
    }
  });

  console.log('newVotes', newVotes);

  return newVotes;
};
