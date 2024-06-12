import { useEffect } from 'react';
import { StakingContract } from 'types/index';
import { useBlock } from 'wagmi';

import { setStakingContracts } from 'store/govern';
import { useAppDispatch, useAppSelector } from 'store/index';

import { RETAINER_ADDRESS } from 'common-util/constants/addresses';
import { LATEST_BLOCK_KEY, NEXT_RELATIVE_WEIGHTS_KEY } from 'common-util/constants/scopeKeys';
import { getBytes32FromAddress } from 'common-util/functions';
import { getStartOfNextWeek } from 'common-util/functions/time';

import { useNominees } from './useNominees';
import { useNomineesMetadata } from './useNomineesMetadata';
import { useNomineesWeights } from './useNomineesWeights';

export const useFetchStakingContractsList = () => {
  const dispatch = useAppDispatch();
  const { stakingContracts } = useAppSelector((state) => state.govern);

  // Get nominees list
  const { data: nominees } = useNominees();

  const { data: block } = useBlock({ blockTag: 'latest', scopeKey: LATEST_BLOCK_KEY });
  const now = block ? Number(block.timestamp) : null;
  const nextWeek = block ? getStartOfNextWeek() : null;

  // Get contracts current weight
  const { data: currentWeight } = useNomineesWeights(nominees || [], now);

  // TODO: important!
  // There might be cases when there are no votes for some of the contracts
  // during the week, which means their weights won't be updated in the contract state
  // for the next week. To fix that and see the actual data, we need
  // to callStatic checkpointNominee for each nominee.

  // Get contracts next weight
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
      const stakingContractsList: StakingContract[] = [];
      nominees.forEach((item) => {
        if (item.account !== getBytes32FromAddress(RETAINER_ADDRESS)) {
          stakingContractsList.push({
            address: item.account,
            chainId: Number(item.chainId),
            currentWeight: currentWeight[item.account],
            nextWeight: nextWeight[item.account],
            metadata: metadata[item.account],
          });
        }
      });

      dispatch(setStakingContracts(stakingContractsList));
    }
  }, [currentWeight, dispatch, metadata, nextWeight, nominees, stakingContracts.length]);
};
