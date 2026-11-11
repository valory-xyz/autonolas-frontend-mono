import { useEffect, useMemo, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Address, MulticallResponse } from 'viem';
import { mainnet } from 'viem/chains';
import { useReadContract, useReadContracts } from 'wagmi';
import { cloneDeep } from 'lodash';

import { useAppSelector } from 'store/index';
import { useNomineesWeights } from 'hooks/useNomineesWeights';
import { TOKENOMICS } from 'libs/util-contracts/src';
import { DISPENSER } from 'libs/util-contracts/src/lib/abiAndAddresses';

import { getNomineeHash } from 'common-util/functions/nominee-hash';
import type { ClaimBatch } from 'common-util/functions/staking-incentives-claim';
import { useEpochCounter, useEpochTokenomics } from 'components/Donate/hooks';
import type { StakingContract } from 'types';

const MAX_BATCH_SIZE = 10;

const useMinStakingValue = ({ epoch }: { epoch: number | null }) => {
  const {
    data: minStakingWeight,
    isLoading: isMinStakingLoading,
    error: minStakingError,
  } = useReadContract({
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

  return { minStakingWeight, isMinStakingLoading, minStakingError };
};

/**
 * Last claimed epoch per nominee address. Throws on a failed read: `useReadContracts` allows
 * failures, and a failed read would otherwise become `NaN` and drop the contract as claimed.
 */
const toLastClaimedEpochs = (
  nominees: StakingContract[],
  results: readonly MulticallResponse<unknown>[] | undefined,
): Record<Address, number> =>
  nominees.reduce(
    (acc, nominee, index) => {
      const read = results?.[index];
      if (read?.status !== 'success') {
        throw new Error(`Could not read the claim cursor of staking contract ${nominee.address}`);
      }
      acc[nominee.address] = Number(read.result);
      return acc;
    },
    {} as Record<Address, number>,
  );

/**
 * The rebuilt batches. `cursorsChanged`: a cursor moved that this user's own recorded claims do
 * not explain, i.e. a concurrent claim. `listChanged`: the rebuilt list differs from the one shown,
 * own claims included, so the caller must restart from its first batch.
 */
export type ClaimableBatchesRefresh = {
  batches: ClaimBatch[];
  cursorsChanged: boolean;
  listChanged: boolean;
};

const haveCursorsChanged = (
  expected: Record<Address, number> | null,
  fresh: Record<Address, number>,
) =>
  !expected ||
  Object.keys(fresh).some((address) => expected[address as Address] !== fresh[address as Address]);

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
    refetch: refetchLastClaimedStakingEpoch,
  } = useReadContracts({
    contracts,
  });

  const clearLastClaimedStakingEpoch = useCallback(() => {
    queryClient.removeQueries({ queryKey });
  }, [queryClient, queryKey]);

  const { epochs: lastClaimedStakingEpochByNominee, error: lastClaimedError } = useMemo(() => {
    if (!lastClaimedStakingEpoch) return { epochs: null, error: null };
    try {
      return { epochs: toLastClaimedEpochs(nominees, lastClaimedStakingEpoch), error: null };
    } catch (error) {
      console.error(error);
      return { epochs: null, error: error instanceof Error ? error.message : String(error) };
    }
  }, [lastClaimedStakingEpoch, nominees]);

  const refetchLastClaimedEpochs = useCallback(async () => {
    const { data } = await refetchLastClaimedStakingEpoch({ throwOnError: true });
    return toLastClaimedEpochs(nominees, data);
  }, [nominees, refetchLastClaimedStakingEpoch]);

  return {
    lastClaimedStakingEpochByNominee,
    lastClaimedError,
    isLastClaimedLoading,
    clearLastClaimedStakingEpoch,
    refetchLastClaimedEpochs,
  };
};

const useNomineesWeightsAtPrevEpochEnd = ({
  nominees,
  previousEpoch,
}: {
  nominees: StakingContract[];
  previousEpoch: number | null;
}) => {
  const { data: prevEpochPoint, error: prevEpochError } = useEpochTokenomics(previousEpoch);

  const { data: nomineesWeightsAtPrevEpochEnd, error: weightsError } = useNomineesWeights(
    nominees.map((nominee) => ({
      account: nominee.address,
      chainId: BigInt(nominee.chainId),
    })),
    prevEpochPoint?.endTime || null,
  );

  return {
    nomineesWeightsAtPrevEpochEnd,
    weightsError: prevEpochError ?? weightsError,
  };
};

/**
 * Assuming max batch size to be "3"
 * nomineesTimesToClaimArray: [[0x1, 1], [0x2, 1], [0x3, 2], [0x4, 1]]
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

type BuildClaimBatchesParams = {
  nominees: StakingContract[];
  /** Last claimed epoch per nominee address (the Dispenser's claim cursor). */
  lastClaimedEpochs: Record<Address, number>;
  currentEpoch: number;
  minStakingWeight: number;
  /**
   * Relative weight per nominee address at the previous epoch's end, in percent × 100: the same
   * unit as `minStakingWeight`.
   */
  relativeWeights: Record<Address, number>;
};

export const buildClaimBatches = ({
  nominees,
  lastClaimedEpochs,
  currentEpoch,
  minStakingWeight,
  relativeWeights,
}: BuildClaimBatchesParams): ClaimBatch[] => {
  /**
   * Filter nominees to be claimed as per the conditions:
   * 1. Nominee's relative weight is at least the min staking weight
   * 2. Nominee has not claimed in the current or future epochs
   */
  const filteredNominees = nominees.filter((nominee) => {
    const nomineeRelativeWeight = relativeWeights[nominee.address];
    const lastClaimedStakingEpoch = lastClaimedEpochs[nominee.address];

    return nomineeRelativeWeight >= minStakingWeight && lastClaimedStakingEpoch < currentEpoch;
  });

  const nomineesByChain = filteredNominees.reduce(
    (acc, nominee) => {
      acc[nominee.chainId] = [...(acc[nominee.chainId] || []), nominee.address];
      return acc;
    },
    {} as Record<number, Address[]>,
  );

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
      const nomineesTimesToClaimArray = nominees.reduce(
        (acc, nominee) => {
          const lastClaimedStakingEpoch = lastClaimedEpochs[nominee];
          acc.push([nominee, currentEpoch - lastClaimedStakingEpoch]);
          return acc;
        },
        [] as [Address, number][],
      );
      const chunks = chunkNomineesArrayByTimeToClaim(nomineesTimesToClaimArray, MAX_BATCH_SIZE);
      acc[Number(chainId)] = chunks;
      return acc;
    },
    {} as Record<number, Address[][]>,
  );

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
  const batches: ClaimBatch[] = [];
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
};

export const useClaimableNomineesBatches = () => {
  const nominees = useAppSelector((state) => state.govern.stakingContracts);
  const { data: currentEpoch, isLoading: isEpochLoading, error: epochError } = useEpochCounter();
  const previousEpoch = currentEpoch ? currentEpoch - 1 : null;
  const { minStakingWeight, isMinStakingLoading, minStakingError } = useMinStakingValue({
    epoch: previousEpoch,
  });
  const {
    lastClaimedStakingEpochByNominee,
    lastClaimedError,
    isLastClaimedLoading,
    clearLastClaimedStakingEpoch,
    refetchLastClaimedEpochs,
  } = useNomineesLastClaimedStakingEpoch({ nominees });
  const { nomineesWeightsAtPrevEpochEnd, weightsError } = useNomineesWeightsAtPrevEpochEnd({
    nominees,
    previousEpoch,
  });

  // A failed read would otherwise leave no batches and read as everything claimed.
  const readError = epochError ?? minStakingError ?? weightsError;
  useEffect(() => {
    if (readError) console.error('Could not read the claimable staking contracts', readError);
  }, [readError]);
  const claimableBatchesError =
    lastClaimedError ??
    (readError
      ? ((readError as { shortMessage?: string }).shortMessage ?? readError.message)
      : null);

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

  const relativeWeights = useMemo(() => {
    if (!nomineesWeightsAtPrevEpochEnd) return null;
    return nominees.reduce(
      (acc, nominee) => {
        acc[nominee.address] = nomineesWeightsAtPrevEpochEnd[nominee.address].percentage * 100;
        return acc;
      },
      {} as Record<Address, number>,
    );
  }, [nominees, nomineesWeightsAtPrevEpochEnd]);

  const nomineesToClaimBatches = useMemo(() => {
    if (
      !nominees.length ||
      !lastClaimedStakingEpochByNominee ||
      !currentEpoch ||
      !minStakingWeight ||
      !relativeWeights
    )
      return [];

    return buildClaimBatches({
      nominees,
      lastClaimedEpochs: lastClaimedStakingEpochByNominee,
      currentEpoch,
      minStakingWeight,
      relativeWeights,
    });
  }, [nominees, lastClaimedStakingEpochByNominee, currentEpoch, minStakingWeight, relativeWeights]);

  // The cursors the batches were last built from, so a refresh can tell whether any moved.
  const builtFromCursors = useRef(lastClaimedStakingEpochByNominee);
  builtFromCursors.current = lastClaimedStakingEpochByNominee;
  // Cursors this user's own confirmed claims advanced to, which the cache does not show yet.
  const ownClaimedThrough = useRef<Record<Address, number>>({});

  const getExpectedCursors = useCallback(() => {
    const built = builtFromCursors.current;
    if (!built) return null;
    return Object.fromEntries(
      Object.entries(built).map(([address, cursor]) => [
        address,
        Math.max(cursor, ownClaimedThrough.current[address as Address] ?? cursor),
      ]),
    ) as Record<Address, number>;
  }, []);

  /** Records a confirmed claim, so the cursors it advanced do not later read as a concurrent claim. */
  const recordClaimedBatch = useCallback(
    ([, stakingTargets]: ClaimBatch) => {
      const expected = getExpectedCursors();
      if (!expected) return;
      stakingTargets.flat().forEach((address) => {
        ownClaimedThrough.current[address] = expected[address] + 1;
      });
    },
    [getExpectedCursors],
  );

  /**
   * Re-reads the claim cursors and rebuilds the batches from them, e.g. after another claimer
   * advanced a cursor. Throws if a cursor cannot be read, rather than reporting it as claimed.
   */
  const refetchClaimableBatches = useCallback(async (): Promise<ClaimableBatchesRefresh> => {
    if (!currentEpoch || !minStakingWeight || !relativeWeights) {
      throw new Error('The claimable staking contracts are still loading. Try again shortly.');
    }
    const lastClaimedEpochs = await refetchLastClaimedEpochs();
    const cursorsChanged = haveCursorsChanged(getExpectedCursors(), lastClaimedEpochs);
    const listChanged = haveCursorsChanged(builtFromCursors.current, lastClaimedEpochs);
    builtFromCursors.current = lastClaimedEpochs;
    ownClaimedThrough.current = {};
    return {
      batches: buildClaimBatches({
        nominees,
        lastClaimedEpochs,
        currentEpoch,
        minStakingWeight,
        relativeWeights,
      }),
      cursorsChanged,
      listChanged,
    };
  }, [
    nominees,
    currentEpoch,
    minStakingWeight,
    relativeWeights,
    refetchLastClaimedEpochs,
    getExpectedCursors,
  ]);

  return {
    nomineesToClaimBatches,
    claimableBatchesError,
    recordClaimedBatch,
    isLoadingClaimableBatches: isLoading,
    clearClaimableBatches,
    refetchClaimableBatches,
  };
};
