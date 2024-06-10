import { useEffect } from 'react';
import { useBlock } from 'wagmi';

import { setStakingContracts } from 'store/govern';
import { useAppDispatch, useAppSelector } from 'store/index';

import { NEXT_RELATIVE_WEIGHTS_KEY } from 'common-util/constants/scopeKeys';
import { getStartOfNextWeek } from 'common-util/functions/time';

import { useNominees } from './useNominees';
import { useNomineesMetadata } from './useNomineesMetadata';
import { useNomineesWeights } from './useNomineesWeights';

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
  const { data: nextWeight } = useNomineesWeights(
    nominees || [],
    nextWeek,
    NEXT_RELATIVE_WEIGHTS_KEY,
  );

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
