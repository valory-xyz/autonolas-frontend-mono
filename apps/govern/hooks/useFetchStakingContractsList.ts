import { useEffect } from 'react';
import { useBlock } from 'wagmi';

import { setStakingContracts } from 'store/govern';
import { useAppDispatch, useAppSelector } from 'store/index';

import { useNominees } from './useNominees';
import { useNomineesMetadata } from './useNomineesMetadata';
import { useNomineesWeights } from './useNomineesWeights';

const getStartOfNextWeek = () => {
  const date = new Date();
  const dayOfWeek = date.getDay();
  const daysUntilNextWeek = (8 - dayOfWeek) % 7;
  const nextWeekStartDate = new Date(date);
  nextWeekStartDate.setDate(date.getDate() + daysUntilNextWeek);
  nextWeekStartDate.setHours(0, 0, 0, 0);
  return nextWeekStartDate.getTime() / 1000;
};

export const useFetchStakingContractsList = () => {
  const dispatch = useAppDispatch();
  const { stakingContracts } = useAppSelector((state) => state.govern);

  // Get nominees list
  const { data: nominees } = useNominees();

  // Get weights for current and next period
  const { data: block } = useBlock({ blockTag: 'latest' });
  const now = block ? Number(block.timestamp) : null;
  const nextWeek = block ? getStartOfNextWeek() : null;

  const { data: currentWeight } = useNomineesWeights(nominees || [], now);
  const { data: nextWeight } = useNomineesWeights(nominees || [], nextWeek);

  // Get contracts metadata
  const { data: metadata } = useNomineesMetadata(nominees || []);

  /**
   * Sets staking contracts list to the store
   **/
  useEffect(() => {
    if (
      // Check if all data is loaded
      !!nominees &&
      !!currentWeight &&
      !!nextWeight &&
      !!metadata &&
      // And it's not yet in the store
      stakingContracts.length === 0
    ) {
      const stakingContractsList = nominees.map((item) => ({
        address: item.account,
        chainId: Number(item.chainId),
        currentWeight: currentWeight[item.account],
        nextWeight: nextWeight[item.account],
        metadata: metadata[item.account],
      }));

      dispatch(setStakingContracts(stakingContractsList));
    }
  }, [currentWeight, dispatch, metadata, nextWeight, nominees, stakingContracts.length]);
};
