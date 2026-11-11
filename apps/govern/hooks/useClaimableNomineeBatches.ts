import { useEffect, useMemo, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Address, MulticallResponse } from 'viem';
import { mainnet } from 'viem/chains';
import { useReadContract, useReadContracts } from 'wagmi';

import { useAppSelector } from 'store/index';
import { useNomineesWeights } from 'hooks/useNomineesWeights';
import { TOKENOMICS } from 'libs/util-contracts/src';
import { errorMessage } from 'libs/util-functions/src';
import { DISPENSER } from 'libs/util-contracts/src/lib/abiAndAddresses';

import { DISPENSER_ADDRESS } from 'common-util/constants/addresses';
import { getNomineeHash } from 'common-util/functions/nominee-hash';
import {
  buildClaimBatches,
  type ClaimableBatchesRefresh,
  type Cursors,
  getCursorChange,
} from 'common-util/functions/claim-batches';
import type { ClaimBatch } from 'common-util/functions/staking-incentives-claim';
import { useEpochCounter, useEpochTokenomics } from 'components/Donate/hooks';
import type { StakingContract } from 'types';

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
        throw new Error(`Could not read the claim cursor of staking contract ${nominee.address}`, {
          cause: read?.error,
        });
      }
      acc[nominee.address] = Number(read.result);
      return acc;
    },
    {} as Record<Address, number>,
  );

const useNomineesLastClaimedStakingEpoch = ({ nominees }: { nominees: StakingContract[] }) => {
  const queryClient = useQueryClient();
  const contracts = nominees.map((nominee) => ({
    address: DISPENSER_ADDRESS,
    abi: DISPENSER.abi,
    chainId: mainnet.id,
    functionName: 'mapLastClaimedStakingEpochs',
    args: [getNomineeHash(nominee.address, nominee.chainId)],
  }));
  const {
    data: lastClaimedStakingEpoch,
    error: lastClaimedQueryError,
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
    if (!lastClaimedStakingEpoch) return { epochs: null, error: lastClaimedQueryError ?? null };
    try {
      return { epochs: toLastClaimedEpochs(nominees, lastClaimedStakingEpoch), error: null };
    } catch (error) {
      return { epochs: null, error };
    }
  }, [lastClaimedStakingEpoch, lastClaimedQueryError, nominees]);

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
    error: prevEpochError ?? weightsError,
  };
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
  const { nomineesWeightsAtPrevEpochEnd, error: prevEpochWeightsError } =
    useNomineesWeightsAtPrevEpochEnd({
      nominees,
      previousEpoch,
    });

  const relativeWeights = useMemo(() => {
    if (!nomineesWeightsAtPrevEpochEnd) return null;
    const weights: Partial<Record<Address, number>> = {};
    for (const [address, weight] of Object.entries(nomineesWeightsAtPrevEpochEnd)) {
      if (weight) weights[address as Address] = weight.percentage * 100;
    }
    return weights;
  }, [nomineesWeightsAtPrevEpochEnd]);

  const { batches: nomineesToClaimBatches, buildError } = useMemo((): {
    batches: ClaimBatch[];
    buildError: unknown;
  } => {
    if (
      !nominees.length ||
      !lastClaimedStakingEpochByNominee ||
      !currentEpoch ||
      !minStakingWeight ||
      !relativeWeights
    )
      return { batches: [], buildError: null };
    try {
      const batches = buildClaimBatches({
        nominees,
        lastClaimedEpochs: lastClaimedStakingEpochByNominee,
        currentEpoch,
        minStakingWeight,
        relativeWeights,
      });
      return { batches, buildError: null };
    } catch (error) {
      return { batches: [], buildError: error };
    }
  }, [nominees, lastClaimedStakingEpochByNominee, currentEpoch, minStakingWeight, relativeWeights]);

  const readError =
    lastClaimedError ?? epochError ?? minStakingError ?? prevEpochWeightsError ?? buildError;
  useEffect(() => {
    if (readError) console.error('Could not read the claimable staking contracts', readError);
  }, [readError]);
  const claimableBatchesError = readError ? errorMessage(readError) : null;

  // Calculate if we're still loading data
  // A failed read ends the loading: its reads would otherwise never settle.
  const isLoading =
    !readError &&
    (isEpochLoading ||
      isMinStakingLoading ||
      isLastClaimedLoading ||
      !nominees.length ||
      !nomineesWeightsAtPrevEpochEnd);

  /**
   * Clear the last claimed staking epoch for the nominees, this is required in
   * case the user claims one or more batches and closes the modal but few batches
   * are still remaining to be claimed. This will make sure we show the latest state to the user.
   */
  const clearClaimableBatches = useCallback(async () => {
    await clearLastClaimedStakingEpoch();
  }, [clearLastClaimedStakingEpoch]);

  // The cursors the batches were last built from, so a refresh can tell whether any moved.
  const builtFromCursors = useRef(lastClaimedStakingEpochByNominee);
  builtFromCursors.current = lastClaimedStakingEpochByNominee;
  // Cursors this user's own confirmed claims advanced to, which the cache does not show yet.
  const ownClaimedThrough = useRef<Cursors>({});

  const getExpectedCursors = useCallback((): Cursors | null => {
    const built = builtFromCursors.current;
    if (!built) return null;
    return Object.fromEntries(
      Object.entries(built).map(([address, cursor]) => [
        address,
        Math.max(cursor, ownClaimedThrough.current[address as Address] ?? cursor),
      ]),
    );
  }, []);

  /** Records a confirmed claim, so the cursors it advanced do not later read as a concurrent claim. */
  const recordClaimedBatch = useCallback(
    ([, stakingTargets]: ClaimBatch) => {
      const expected = getExpectedCursors();
      if (!expected) return;
      stakingTargets.flat().forEach((address) => {
        const cursor = expected[address];
        // Not in the list the cursors were read for: the next refresh reads it as concurrent.
        if (cursor === undefined) return;
        ownClaimedThrough.current[address] = cursor + 1;
      });
    },
    [getExpectedCursors],
  );

  /**
   * Re-reads the claim cursors and rebuilds the batches from them, e.g. after another claimer
   * advanced a cursor. Throws if a cursor cannot be read.
   */
  const refetchClaimableBatches = useCallback(async (): Promise<ClaimableBatchesRefresh> => {
    if (!currentEpoch || !minStakingWeight || !relativeWeights) {
      throw new Error('The claimable staking contracts are still loading. Try again shortly.');
    }
    const lastClaimedEpochs = await refetchLastClaimedEpochs();
    const change = getCursorChange(
      builtFromCursors.current,
      getExpectedCursors(),
      lastClaimedEpochs,
    );
    builtFromCursors.current = lastClaimedEpochs;
    // Keep the own claims a lagging read has not reached yet, so they never read as concurrent.
    ownClaimedThrough.current = Object.fromEntries(
      Object.entries(ownClaimedThrough.current).filter(
        ([address, through]) =>
          through !== undefined && lastClaimedEpochs[address as Address] < through,
      ),
    );
    return {
      batches: buildClaimBatches({
        nominees,
        lastClaimedEpochs,
        currentEpoch,
        minStakingWeight,
        relativeWeights,
      }),
      change,
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
