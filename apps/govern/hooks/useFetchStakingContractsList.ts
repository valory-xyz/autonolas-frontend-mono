import { useEffect } from 'react';
import { StakingContract } from 'types';
import { Address } from 'viem';
import { mainnet } from 'viem/chains';
import { useReadContract } from 'wagmi';

import { useNominees, useNomineesMetadata } from 'libs/common-contract-functions/src';
import { RETAINER_ADDRESS } from 'libs/util-constants/src';
import { VOTE_WEIGHTING } from 'libs/util-contracts/src/lib/abiAndAddresses';

import { NEXT_RELATIVE_WEIGHTS_KEY, TIME_SUM_KEY } from 'common-util/constants/scopeKeys';
import { setStakingContracts } from 'store/govern';
import { useAppDispatch, useAppSelector } from 'store/index';

import { useNomineesWeights } from './useNomineesWeights';
import { getBytes32FromAddress } from 'libs/util-functions/src';
import { WEEK_IN_SECONDS } from 'common-util/constants/time';

// Blacklisted staking contracts that should not be displayed
const BLACKLISTED_ADDRESSES = [
  RETAINER_ADDRESS,
  // Jinn staking contract with invalid IPFS metadata (keccak256 hash instead of IPFS CID)
  '0x0dfafbf570e9e813507aae18aa08dfba0abc5139',
];

const getCurrentWeightTimestamp = (timeSum: number | undefined) => {
  if (!timeSum) return null;
  // If timeSum is in the future, subtract a week from it
  if (timeSum * 1000 > Date.now()) return timeSum - WEEK_IN_SECONDS;
  return timeSum;
};

export const useFetchStakingContractsList = () => {
  const dispatch = useAppDispatch();
  const { stakingContracts } = useAppSelector((state) => state.govern);

  // Get nominees list
  const { data: nominees } = useNominees();

  // Get last scheduled time (next week) from the contract
  // Has the timestamp when the last votes should be applied
  const { data: timeSum } = useReadContract({
    address: (VOTE_WEIGHTING.addresses as Record<number, Address>)[mainnet.id],
    abi: VOTE_WEIGHTING.abi,
    chainId: mainnet.id,
    functionName: 'timeSum',
    scopeKey: TIME_SUM_KEY,
    query: {
      select: (data) => Number(data),
    },
  });

  // Get contracts current week weights
  const { data: currentWeight } = useNomineesWeights(
    nominees || [],
    getCurrentWeightTimestamp(timeSum),
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
        // Check if the nominee is blacklisted
        const isBlacklisted = BLACKLISTED_ADDRESSES.some(
          (addr) => item.account === getBytes32FromAddress(addr)
        );
        
        if (!isBlacklisted) {
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
