import { useEffect, useMemo, useCallback, useRef, useState } from 'react';
import { isEqual } from 'lodash';
import { useStore } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import type { Address, MulticallResponse } from 'viem';
import { mainnet } from 'viem/chains';
import { useReadContract, useReadContracts } from 'wagmi';

import { pruneOwnClaims } from 'store/govern';
import { type RootState, useAppDispatch, useAppSelector } from 'store/index';
import { useNomineesWeights } from 'hooks/useNomineesWeights';
import { TOKENOMICS } from 'libs/util-contracts/src';
import { getErrorMessage } from 'libs/util-functions/src';
import { DISPENSER } from 'libs/util-contracts/src/lib/abiAndAddresses';

import { DISPENSER_ADDRESS } from 'common-util/constants/addresses';
import { getNomineeHash } from 'common-util/functions/nominee-hash';
import {
  buildClaimBatches,
  type ByAddress,
  type ClaimableBatchesRefresh,
  type Cursors,
  getCursorChange,
  claimedThroughOf,
  getExpectedCursors,
  READ_TARGET,
  readFailure,
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
        throw readFailure(READ_TARGET.claimCursor, nominee.address, read?.error);
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

  const {
    data: nomineesWeightsAtPrevEpochEnd,
    weightReadErrors,
    error: weightsError,
  } = useNomineesWeights(
    nominees.map((nominee) => ({
      account: nominee.address,
      chainId: BigInt(nominee.chainId),
    })),
    prevEpochPoint?.endTime || null,
  );

  return {
    nomineesWeightsAtPrevEpochEnd,
    weightReadErrors,
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
  const {
    nomineesWeightsAtPrevEpochEnd,
    weightReadErrors,
    error: prevEpochWeightsError,
  } = useNomineesWeightsAtPrevEpochEnd({
    nominees,
    previousEpoch,
  });

  const relativeWeights = useMemo(() => {
    if (!nomineesWeightsAtPrevEpochEnd) return null;
    const weights: ByAddress = {};
    for (const [address, weight] of Object.entries(nomineesWeightsAtPrevEpochEnd)) {
      if (weight) weights[address as Address] = weight.percentage * 100;
    }
    return weights;
  }, [nomineesWeightsAtPrevEpochEnd]);

  const store = useStore<RootState>();
  const dispatch = useAppDispatch();
  // In the store, so a claim confirmed after its modal closed still counts in the next one.
  const readOwnClaims = useCallback(
    (): Cursors => store.getState().govern.ownClaimedThrough,
    [store],
  );

  // Bumped by a refresh, so the shown list takes up claims recorded since it was built. A claim
  // recorded on its own does not rebuild it: the modal steps through this list by index.
  const [refreshCount, setRefreshCount] = useState(0);

  const {
    batches: nomineesToClaimBatches,
    buildError,
    builtWithOwnClaims,
  } = useMemo((): {
    batches: ClaimBatch[];
    buildError: unknown;
    builtWithOwnClaims: Cursors;
  } => {
    const own = readOwnClaims();
    if (
      !nominees.length ||
      !lastClaimedStakingEpochByNominee ||
      !currentEpoch ||
      !minStakingWeight ||
      !relativeWeights
    )
      return { batches: [], buildError: null, builtWithOwnClaims: own };
    try {
      const batches = buildClaimBatches({
        nominees,
        lastClaimedEpochs: getExpectedCursors(lastClaimedStakingEpochByNominee, own),
        currentEpoch,
        minStakingWeight,
        relativeWeights,
        weightReadErrors,
      });
      return { batches, buildError: null, builtWithOwnClaims: own };
    } catch (error) {
      return { batches: [], buildError: error, builtWithOwnClaims: own };
    }
    // `refreshCount` only re-runs the build after a refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    nominees,
    lastClaimedStakingEpochByNominee,
    currentEpoch,
    minStakingWeight,
    relativeWeights,
    weightReadErrors,
    readOwnClaims,
    refreshCount,
  ]);
  const shownOwnClaims = useRef(builtWithOwnClaims);
  shownOwnClaims.current = builtWithOwnClaims;

  const readError =
    lastClaimedError ?? epochError ?? minStakingError ?? prevEpochWeightsError ?? buildError;
  useEffect(() => {
    if (readError) console.error('Could not read the claimable staking contracts', readError);
  }, [readError]);
  const claimableBatchesError = readError ? getErrorMessage(readError) : null;

  // A failed read ends the loading: without its data the weights read never runs, so
  // `nomineesWeightsAtPrevEpochEnd` would keep it on.
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
  /**
   * Uses the latest cursor read and every own claim recorded so far, so a claim sent after an
   * earlier one moves on from it. Taken when a claim is sent, so its confirmation records it
   * whatever this or another modal has loaded by then.
   */
  const getClaimedThrough = useCallback(
    (batch: ClaimBatch): Cursors => {
      const expected = getExpectedCursors(builtFromCursors.current, readOwnClaims());
      return expected ? claimedThroughOf(expected, batch) : {};
    },
    [readOwnClaims],
  );

  /**
   * Re-reads the claim cursors and rebuilds the batches from them, e.g. after another claimer
   * advanced a cursor. Throws while the claim data is still loading, if a cursor cannot be read,
   * or if a nominee's vote weight could not be read.
   */
  const refetchClaimableBatches = useCallback(async (): Promise<ClaimableBatchesRefresh> => {
    if (!currentEpoch || !minStakingWeight || !relativeWeights) {
      throw new Error('The claimable staking contracts are still loading. Try again shortly.');
    }
    const lastClaimedEpochs = await refetchLastClaimedEpochs();
    const own = readOwnClaims();
    const cursorChange = getCursorChange(
      builtFromCursors.current,
      getExpectedCursors(builtFromCursors.current, own),
      lastClaimedEpochs,
    );
    // A claim confirmed since the list was built (late, or in another modal) changes the list even
    // when the read lags it and shows no cursor move.
    const shown = getExpectedCursors(builtFromCursors.current, shownOwnClaims.current);
    const listChanged = !isEqual(shown, getExpectedCursors(lastClaimedEpochs, own));
    const change = cursorChange === 'none' && listChanged ? 'own-claims' : cursorChange;
    builtFromCursors.current = lastClaimedEpochs;
    dispatch(pruneOwnClaims(lastClaimedEpochs));
    setRefreshCount((count) => count + 1);
    return {
      batches: buildClaimBatches({
        nominees,
        lastClaimedEpochs: getExpectedCursors(lastClaimedEpochs, own),
        currentEpoch,
        minStakingWeight,
        relativeWeights,
        weightReadErrors,
      }),
      change,
    };
  }, [
    nominees,
    currentEpoch,
    minStakingWeight,
    relativeWeights,
    refetchLastClaimedEpochs,
    weightReadErrors,
    readOwnClaims,
    dispatch,
  ]);

  return {
    nomineesToClaimBatches,
    claimableBatchesError,
    getClaimedThrough,
    isLoadingClaimableBatches: isLoading,
    clearClaimableBatches,
    refetchClaimableBatches,
  };
};
