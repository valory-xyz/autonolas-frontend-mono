import { Allocation, StakingContract, UserVotes } from 'types';
import { Address } from 'viem';

export const MAX_ALLOCATED_POWER = 10_000;

type ReorderedVote = {
  address: Address;
  chainId: number;
  weight: string;
  metadata?: Allocation['metadata'];
};

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
): ReorderedVote[] => {
  // Sort new allocation by ascending weights (percentages)
  const sortedAllocations = [...allocations].sort((a, b) => a.weight - b.weight);

  const allocationsByAddress = new Map(
    allocations.map((allocation) => [allocation.address.toLowerCase(), allocation]),
  );
  const stakingByAddress = new Map(
    stakingContracts.map((contract) => [contract.address.toLowerCase(), contract]),
  );

  // Sort old votes by descending weights (base units)
  const sortedOldVotes = [...Object.entries(userVotes)].sort(
    ([_aKey, aValue], [_bKey, bValue]) => bValue.current.power - aValue.current.power,
  );

  const result: ReorderedVote[] = [];
  const processedAddresses = new Set<string>();

  const resetVotes: ReorderedVote[] = [];
  const decreaseVotes: ReorderedVote[] = [];
  const increasedAllocations: Allocation[] = [];

  const toBaseUnits = (weightPercentage: number) => Math.floor(weightPercentage * 100);

  // Start from old votes
  sortedOldVotes.forEach(([oldVoteAddress, oldVoteValue]) => {
    const key = oldVoteAddress.toLowerCase();
    const allocation = allocationsByAddress.get(key);
    const oldPower = oldVoteValue.current.power;

    if (allocation) {
      const newPower = toBaseUnits(allocation.weight);

      if (newPower < oldPower) {
        // Negative delta – apply first (after pure resets) to free up power.
        decreaseVotes.push({
          address: allocation.address as Address,
          chainId: allocation.chainId,
          weight: `${newPower}`,
          metadata: allocation.metadata,
        });
        processedAddresses.add(key);
      } else if (newPower > oldPower) {
        // Positive delta – apply later, after all decreases.
        increasedAllocations.push(allocation);
      } else {
        // Same power - nothing to send.
        processedAddresses.add(key);
      }
    } else {
      // Otherwise we need to remove weight from that contract
      // before voting on the others contracts
      const stakingContract = stakingByAddress.get(key);
      if (stakingContract) {
        resetVotes.push({
          address: stakingContract.address as Address,
          chainId: stakingContract.chainId,
          weight: '0',
          metadata: stakingContract.metadata,
        });
        processedAddresses.add(key);
      }
    }
  });

  // Reset votes from removed contracts first
  result.push(...resetVotes);

  // Handle existing contracts with decreased votes
  result.push(...decreaseVotes);

  // Handle existing contracts with increased votes
  increasedAllocations
    .slice()
    .sort((a, b) => a.weight - b.weight)
    .forEach((allocation) => {
      const key = allocation.address.toLowerCase();
      if (processedAddresses.has(key)) return;

      const newPower = toBaseUnits(allocation.weight);
      const oldPower = userVotes[allocation.address]?.current.power ?? 0;
      if (newPower === oldPower) return;

      result.push({
        address: allocation.address as Address,
        chainId: allocation.chainId,
        weight: `${newPower}`,
        metadata: allocation.metadata,
      });
      processedAddresses.add(key);
    });

  // 4) Handle newly added contracts (no previous votes), ordered by ascending new power
  sortedAllocations.forEach((allocation) => {
    const key = allocation.address.toLowerCase();
    if (processedAddresses.has(key)) return;

    const newPower = toBaseUnits(allocation.weight);
    const oldPower = userVotes[allocation.address]?.current.power ?? 0;

    if (newPower === oldPower) return;

    result.push({
      address: allocation.address as Address,
      chainId: allocation.chainId,
      weight: `${newPower}`,
      metadata: allocation.metadata,
    });
    processedAddresses.add(key);
  });

  return result;
};
