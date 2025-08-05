import { useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Address } from 'viem';
import { mainnet } from 'viem/chains';
import { useReadContract, useReadContracts } from 'wagmi';
import { cloneDeep } from 'lodash';

import { useAppSelector } from 'store/index';
import { useNomineesWeights } from 'hooks/useNomineesWeights';
import { TOKENOMICS } from 'libs/util-contracts/src';
import { DISPENSER } from 'libs/util-contracts/src/lib/abiAndAddresses';

import { getNomineeHash } from 'common-util/functions/nominee-hash';
import { useEpochCounter, useEpochTokenomics } from 'components/Donate/hooks';
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
  const queryClient = useQueryClient();
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
    queryKey,
  } = useReadContracts({
    contracts,
  });

  const clearLastClaimedStakingEpoch = useCallback(() => {
    queryClient.removeQueries({ queryKey });
  }, [queryClient, queryKey]);

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

  return {
    lastClaimedStakingEpochByNominee,
    isLastClaimedLoading,
    clearLastClaimedStakingEpoch,
  };
};

const useNomineesWeightsAtPrevEpochEnd = ({
  nominees,
  previousEpoch,
}: {
  nominees: StakingContract[];
  previousEpoch: number | null;
}) => {
  const { data: prevEpochPoint } = useEpochTokenomics(previousEpoch);

  const { data: nomineesWeightsAtPrevEpochEnd } = useNomineesWeights(
    nominees.map((nominee) => ({
      account: nominee.address,
      chainId: BigInt(nominee.chainId),
    })),
    prevEpochPoint?.endTime || null,
  );

  return {
    nomineesWeightsAtPrevEpochEnd,
  };
};

/**
 * Assuming max batch size to be "3"
 * nomineesToClaimArray: [[0x1, 1], [0x2, 1], [0x3, 2], [0x4, 1]]
 *
 * returns:
 * [
 *  [0x1, 0x2, 0x3],
 *  [0x3, 0x4],
 * ]
 */
const chunkNomineesArrayByTimeToClaim = (
  nomineesTimesToClaimArray: [Address, number][],
  chunkSize: number = MAX_BATCH_SIZE,
) => {
  const chunks: Address[][] = [];
  let filteredNomineesTimesToClaim = cloneDeep(nomineesTimesToClaimArray);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const currentChunk: Address[] = [];
    let index = 0;

    for (index = 0; index < Math.min(chunkSize, filteredNomineesTimesToClaim.length); index++) {
      const nominee = filteredNomineesTimesToClaim[index][0];
      currentChunk.push(nominee);
      /* Decrease time to claim by 1 each time the nominee gets into the currentChunk, this ensures 
      the order as well as the times a nominee needs to be claimed works as expected */
      filteredNomineesTimesToClaim[index][1] -= 1;
    }

    chunks.push(currentChunk);
    filteredNomineesTimesToClaim = filteredNomineesTimesToClaim.filter(
      ([, timesToClaim]) => timesToClaim > 0,
    );

    if (filteredNomineesTimesToClaim.length === 0) {
      break;
    }
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
  const { lastClaimedStakingEpochByNominee, isLastClaimedLoading, clearLastClaimedStakingEpoch } =
    useNomineesLastClaimedStakingEpoch({ nominees });
  const { nomineesWeightsAtPrevEpochEnd } = useNomineesWeightsAtPrevEpochEnd({
    nominees,
    previousEpoch,
  });

  // Calculate if we're still loading data
  const isLoading =
    isEpochLoading ||
    isMinStakingLoading ||
    isLastClaimedLoading ||
    !nominees.length ||
    !nomineesWeightsAtPrevEpochEnd;

  /**
   * Clear the last claimed staking epoch for the nominees, this is required in
   * case the user claims one or more batches and closes the modal but few batches
   * are still remaining to be claimed. This will make sure we show the latest state to the user.
   */
  const clearClaimableBatches = useCallback(async () => {
    await clearLastClaimedStakingEpoch();
  }, [clearLastClaimedStakingEpoch]);

  const nomineesToClaimBatches = useMemo(() => {
    if (
      !nominees.length ||
      !lastClaimedStakingEpochByNominee ||
      !currentEpoch ||
      !minStakingWeight ||
      !nomineesWeightsAtPrevEpochEnd
    )
      return [];

    /**
     * Filter nominees to be claimed as per the conditions:
     * 1. Nominee's relative weight > min staking weight
     * 2. Nominee has not claimed in the current or future epochs
     */
    const filteredNominees = nominees.filter((nominee) => {
      const nomineeRelativeWeight = nomineesWeightsAtPrevEpochEnd[nominee.address].percentage * 100;
      const lastClaimedStakingEpoch = Number(
        lastClaimedStakingEpochByNominee[nominee.address].result,
      );

      return nomineeRelativeWeight >= minStakingWeight && lastClaimedStakingEpoch < currentEpoch;
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

        /**
         * Nominees along with their timesToClaim
         * eg: [[0x1, 1], [0x2, 1], [0x3, 2], [0x4, 1]]
         */
        const nomineedTimesToClaimArray = nominees.reduce(
          (acc, nominee) => {
            const lastClaimedStakingEpoch = Number(
              lastClaimedStakingEpochByNominee[nominee].result,
            );
            acc.push([nominee, currentEpoch - lastClaimedStakingEpoch]);
            return acc;
          },
          [] as [Address, number][],
        );
        const chunks = chunkNomineesArrayByTimeToClaim(nomineedTimesToClaimArray, MAX_BATCH_SIZE);
        acc[Number(chainId)] = chunks;
        return acc;
      },
      {} as Record<number, Address[][]>,
    );

    /**
     * Sort the chain ids in ascending order
     */
    const sortedChainIds = Object.keys(batchesByChain).sort((a, b) => Number(a) - Number(b));

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

      sortedChainIds.forEach((chainId) => {
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
  }, [
    nominees,
    lastClaimedStakingEpochByNominee,
    currentEpoch,
    minStakingWeight,
    nomineesWeightsAtPrevEpochEnd,
  ]);

  return {
    nomineesToClaimBatches,
    isLoadingClaimableBatches: isLoading,
    clearClaimableBatches,
  };
};
