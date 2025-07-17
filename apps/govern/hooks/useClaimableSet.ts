import { useMemo, useCallback } from 'react';
import type { Address } from 'viem';
import { mainnet } from 'viem/chains';
import { useReadContract, useReadContracts } from 'wagmi';

import { useAppSelector } from 'store/index';
import { TOKENOMICS } from 'libs/util-contracts/src';
import { DISPENSER } from 'libs/util-contracts/src/lib/abiAndAddresses';

import { getNomineeHash } from 'common-util/functions/nominee-hash';
import { useEpochCounter } from 'components/Donate/hooks';
import type { StakingContract } from 'types';

const MAX_BATCH_SIZE = 10;

const useMinStakingValue = ({ epoch }: { epoch: number | null }) => {
  const { data: minStakingWeight, isLoading: isMinStakingLoading } = useReadContract({
    address: TOKENOMICS.addresses[mainnet.id],
    abi: TOKENOMICS.abi,
    chainId: mainnet.id,
    functionName: 'mapEpochStakingPoints',
    args: epoch ? [BigInt(epoch)] : undefined,
    query: {
      enabled: !!epoch,
      select: (data) => {
        const [, , minStakingWeight] = data;
        return minStakingWeight;
      },
    },
  });

  return { minStakingWeight, isMinStakingLoading };
};

const useNomineesLastClaimedStakingEpoch = ({ nominees }: { nominees: StakingContract[] }) => {
  const contracts = nominees.map((nominee) => ({
    address: DISPENSER.addresses[mainnet.id],
    abi: DISPENSER.abi,
    chainId: mainnet.id,
    functionName: 'mapLastClaimedStakingEpochs',
    args: [getNomineeHash(nominee.address, nominee.chainId)],
  }));
  const {
    data: lastClaimedStakingEpoch,
    isLoading: isLastClaimedLoading,
    refetch: refetchLastClaimedStakingEpoch,
  } = useReadContracts({
    contracts,
  });

  // Map the results to an object with nominee address as key
  const lastClaimedStakingEpochByNominee = useMemo(() => {
    if (!lastClaimedStakingEpoch) return null;

    return lastClaimedStakingEpoch.reduce(
      (acc, res, index) => {
        acc[nominees[index].address] = res;
        return acc;
      },
      {} as Record<Address, (typeof lastClaimedStakingEpoch)[number]>,
    );
  }, [lastClaimedStakingEpoch, nominees]);

  return { lastClaimedStakingEpochByNominee, isLastClaimedLoading, refetchLastClaimedStakingEpoch };
};

const chunkNomineesArray = (nominees: Address[], chunkSize: number = MAX_BATCH_SIZE) => {
  const chunks = [];
  for (let i = 0; i < nominees.length; i += chunkSize) {
    chunks.push(nominees.slice(i, i + chunkSize));
  }
  return chunks;
};

export const useClaimableNomineesBatches = () => {
  const nominees = useAppSelector((state) => state.govern.stakingContracts);
  const { data: currentEpoch, isLoading: isEpochLoading } = useEpochCounter();
  const previousEpoch = currentEpoch ? currentEpoch - 1 : null;
  const { minStakingWeight, isMinStakingLoading } = useMinStakingValue({
    epoch: previousEpoch,
  });
  const { lastClaimedStakingEpochByNominee, isLastClaimedLoading, refetchLastClaimedStakingEpoch } =
    useNomineesLastClaimedStakingEpoch({ nominees });

  // Calculate if we're still loading data
  const isLoading =
    isEpochLoading || isMinStakingLoading || isLastClaimedLoading || !nominees.length;

  /**
   * Refetch the last claimed staking epoch for the nominees,
   * this is required in case the user claims one or more batches
   * but few batches are still remaining to be claimed.
   * This will make sure we show the latest state to the user.
   */
  const refetchClaimableBatches = useCallback(async () => {
    await refetchLastClaimedStakingEpoch();
  }, [refetchLastClaimedStakingEpoch]);

  // TODO: ignore (0x0, 0) and (0xdead, 1) nominees
  const nomineesToClaimBatches = useMemo(() => {
    if (!nominees.length || !lastClaimedStakingEpochByNominee || !currentEpoch) return [];

    /**
     * Filter nominees to be claimed as per the conditions:
     * 1. Nomineed's relative weight > min staking weight
     * 2. Nominee has not claimed in the current or future epochs
     */
    const filteredNominees = nominees.filter((nominee) => {
      const { nextWeight } = nominee;
      if (!minStakingWeight) return false;
      const nomineeRelativeWeight = nextWeight.percentage * 100;
      return (
        nomineeRelativeWeight >= minStakingWeight &&
        Number(lastClaimedStakingEpochByNominee[nominee.address].result) < currentEpoch
      );
    });

    /**
     * Group nominees by chain Ids and extract their addresses
     */
    const nomineesByChain = filteredNominees.reduce(
      (acc, nominee) => {
        acc[nominee.chainId] = [...(acc[nominee.chainId] || []), nominee.address];
        return acc;
      },
      {} as Record<number, Address[]>,
    );

    /**
     * Sort the addresses lexicographically
     */
    const sortedNomineesByChain = Object.keys(nomineesByChain).reduce(
      (acc, chainId) => {
        acc[Number(chainId)] = nomineesByChain[Number(chainId)].sort((a, b) =>
          a.toString().localeCompare(b.toString()),
        );
        return acc;
      },
      {} as Record<number, Address[]>,
    );

    /**
     * Chunk the nominees array into smaller arrays of max size `MAX_BATCH_SIZE`
     * eg:
     * {
     *  1: [
     *    [0x1, 0x2, 0x3],
     *    [0x4, 0x5, 0x6],
     *    [0x7, 0x8, 0x9],
     *    [0x10, 0x11, 0x12],
     *  ],
     *  2: [
     *    [0x13, 0x14, 0x15],
     *    [0x16, 0x17, 0x18],
     *    [0x19, 0x20, 0x21],
     *    [0x22, 0x23, 0x24],
     *  ],
     * }
     */
    const batchesByChain = Object.keys(sortedNomineesByChain).reduce(
      (acc, chainId) => {
        const nominees = sortedNomineesByChain[Number(chainId)];
        const chunks = chunkNomineesArray(nominees, MAX_BATCH_SIZE);
        acc[Number(chainId)] = chunks;
        return acc;
      },
      {} as Record<number, Address[][]>,
    );

    /**
     * Create batches of nominees to claim
     * eg:
     * [
     *    [[1, 2], [[0x1, 0x2, 0x3], [0x13, 0x14, 0x15]]],
     *    [[1, 2], [[0x4, 0x5, 0x6], [0x16, 0x17, 0x18]]],
     * ]
     * The max size of the second element of the subarray would be determined by the `MAX_BATCH_SIZE`
     */
    let batchIndex = 0;
    const batches: [number[], Address[][]][] = [];
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const currentBatchChainIds: number[] = [];
      const currentBatchNominees: Address[][] = [];

      Object.keys(batchesByChain).forEach((chainId) => {
        const nomineesByChainAtIndex = batchesByChain[Number(chainId)]?.[batchIndex] || [];
        if (nomineesByChainAtIndex.length !== 0) {
          currentBatchChainIds.push(Number(chainId));
          currentBatchNominees.push(nomineesByChainAtIndex);
        }
      });

      batchIndex++;
      if (currentBatchNominees.length === 0) {
        break;
      }

      batches.push([currentBatchChainIds, currentBatchNominees]);
    }

    return batches;
  }, [nominees, lastClaimedStakingEpochByNominee, currentEpoch, minStakingWeight]);

  return {
    nomineesToClaimBatches,
    isLoadingClaimableBatches: isLoading,
    refetchClaimableBatches,
  };
};
