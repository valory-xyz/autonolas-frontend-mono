import { useEffect, useMemo, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { isEqual } from 'lodash';
import type { Address, MulticallResponse } from 'viem';
import { mainnet } from 'viem/chains';
import { useReadContract, useReadContracts } from 'wagmi';

import { useStore } from 'react-redux';

import { setOwnClaimedThrough } from 'store/govern';
import { type RootState, useAppDispatch, useAppSelector } from 'store/index';
import { useNomineesWeights } from 'hooks/useNomineesWeights';
import { TOKENOMICS } from 'libs/util-contracts/src';
import { getErrorMessage } from 'libs/util-functions/src';
import { DISPENSER } from 'libs/util-contracts/src/lib/abiAndAddresses';

import { DISPENSER_ADDRESS } from 'common-util/constants/addresses';
import { getNomineeHash } from 'common-util/functions/nominee-hash';
import {
  advanceOwnClaims,
  buildClaimBatches,
  type ByAddress,
  type ClaimableBatchesRefresh,
  type Cursors,
  getCursorChange,
  getExpectedCursors,
  pruneReachedOwnClaims,
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
  const ownClaimedThrough = useAppSelector((state) => state.govern.ownClaimedThrough);
  const readOwnClaims = useCallback(
    (): Cursors => store.getState().govern.ownClaimedThrough,
    [store],
  );
  const writeOwnClaims = useCallback(
    (next: Cursors) => {
      if (!isEqual(next, store.getState().govern.ownClaimedThrough)) {
        dispatch(setOwnClaimedThrough(next));
      }
    },
    [dispatch, store],
  );

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
        lastClaimedEpochs: getExpectedCursors(lastClaimedStakingEpochByNominee, ownClaimedThrough),
        currentEpoch,
        minStakingWeight,
        relativeWeights,
        weightReadErrors,
      });
      return { batches, buildError: null };
    } catch (error) {
      return { batches: [], buildError: error };
    }
  }, [
    nominees,
    lastClaimedStakingEpochByNominee,
    currentEpoch,
    minStakingWeight,
    relativeWeights,
    weightReadErrors,
    ownClaimedThrough,
  ]);

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
  /** Records a confirmed claim, so the cursors it advanced do not later read as a concurrent claim. */
  const recordClaimedBatch = useCallback(
    (batch: ClaimBatch) => {
      const expected = getExpectedCursors(builtFromCursors.current, readOwnClaims());
      if (expected) writeOwnClaims(advanceOwnClaims(readOwnClaims(), expected, batch));
    },
    [readOwnClaims, writeOwnClaims],
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
    const change = getCursorChange(
      builtFromCursors.current,
      getExpectedCursors(builtFromCursors.current, readOwnClaims()),
      lastClaimedEpochs,
    );
    const ownClaimAware = getExpectedCursors(lastClaimedEpochs, readOwnClaims());
    builtFromCursors.current = lastClaimedEpochs;
    writeOwnClaims(pruneReachedOwnClaims(readOwnClaims(), lastClaimedEpochs));
    return {
      batches: buildClaimBatches({
        nominees,
        lastClaimedEpochs: ownClaimAware,
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
    writeOwnClaims,
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
