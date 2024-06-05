import { useEffect } from 'react';
import { useBlock } from 'wagmi';

import { setStakingContracts } from 'store/govern';
import { useAppDispatch, useAppSelector } from 'store/index';

import { useNominees } from './useNominees';
import { useNomineesMetadata } from './useNomineesMetadata';
import { useNomineesWeights } from './useNomineesWeights';

const ONE_WEEK = 7 * 86400;

export const useFetchStakingContractsList = () => {
  const dispatch = useAppDispatch();
  const { stakingContracts } = useAppSelector((state) => state.govern);

  // Get nominees list
  const { data: nominees, isFetching: isNomineesFetching } = useNominees();

  // Get weights
  const { data: block } = useBlock({ blockTag: 'latest', query: { staleTime: Infinity } });
  const now = block ? Number(block.timestamp) : null;
  const nextWeek = block
    ? Math.floor((Number(block.timestamp) + ONE_WEEK) / ONE_WEEK) * ONE_WEEK
    : null;

  const { data: currentWeight, isFetching: isCurrentWeightFetching } = useNomineesWeights(
    nominees || [],
    now,
  );
  const { data: nextWeight, isFetching: isNextWeightFetching } = useNomineesWeights(
    nominees || [],
    nextWeek,
  );

  // Get contracts metadata
  const { data: metadata, isFetching: isMetadataFetching } = useNomineesMetadata(nominees || []);

  useEffect(() => {
    if (
      // check if all data is loaded
      !nominees ||
      isNomineesFetching ||
      !currentWeight ||
      isCurrentWeightFetching ||
      !nextWeight ||
      isNextWeightFetching ||
      !metadata ||
      isMetadataFetching ||
      // and if it's not in store yet
      stakingContracts.length > 0
    )
      return;

    const stakingContractsList = nominees.map((item) => ({
      address: item.account,
      chainId: Number(item.chainId),
      currentWeight: currentWeight[item.account],
      nextWeight: nextWeight[item.account],
      metadata: metadata[item.account],
    }));

    dispatch(setStakingContracts(stakingContractsList));
  }, [
    currentWeight,
    dispatch,
    isCurrentWeightFetching,
    isMetadataFetching,
    isNextWeightFetching,
    isNomineesFetching,
    metadata,
    nextWeight,
    nominees,
    stakingContracts.length,
  ]);
};
