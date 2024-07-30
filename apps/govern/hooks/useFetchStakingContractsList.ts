import { useEffect } from 'react';
import { StakingContract } from 'types';
import { Address } from 'viem';
import { mainnet } from 'viem/chains';
import { useReadContract } from 'wagmi';

import { VOTE_WEIGHTING } from 'libs/util-contracts/src/lib/abiAndAddresses';

import { RETAINER_ADDRESS } from 'common-util/constants/addresses';
import { NEXT_RELATIVE_WEIGHTS_KEY } from 'common-util/constants/scopeKeys';
import { getBytes32FromAddress } from 'common-util/functions';
import { setStakingContracts } from 'store/govern';
import { useAppDispatch, useAppSelector } from 'store/index';

import { useNominees } from './useNominees';
import { useNomineesMetadata } from './useNomineesMetadata';
import { useNomineesWeights } from './useNomineesWeights';

const WEEK = 604_800;

export const useFetchStakingContractsList = () => {
  const dispatch = useAppDispatch();
  const { stakingContracts } = useAppSelector((state) => state.govern);

  // Get nominees list
  const { data: nominees } = useNominees();

  // Get last scheduled time (next week) from the contract
  const { data: timeSum } = useReadContract({
    address: (VOTE_WEIGHTING.addresses as Record<number, Address>)[mainnet.id],
    abi: VOTE_WEIGHTING.abi,
    chainId: mainnet.id,
    functionName: 'timeSum',
    query: {
      select: (data) => Number(data),
    },
  });

  // Get contracts current week weights
  const { data: currentWeight } = useNomineesWeights(
    nominees || [],
    timeSum
      ? // If timeSum is in the future, subtract a week from it
        timeSum * 1000 > Date.now()
        ? timeSum - WEEK
        : timeSum
      : null,
  );

  // Get contracts next week weights
  const { data: nextWeight } = useNomineesWeights(
    nominees || [],
    timeSum || null,
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
