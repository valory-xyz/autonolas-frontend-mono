import { useEffect } from 'react';
import { UserVotes } from 'types/index';
import { useBlock } from 'wagmi';

import { setLastUserVote, setUserVotes } from 'store/govern';
import { useAppDispatch, useAppSelector } from 'store/index';

import { LATEST_BLOCK_KEY, NEXT_USERS_SLOPES_KEY } from 'common-util/constants/scopeKeys';

import { useLastUserVote } from './useLastUserVote';
import { useNominees } from './useNominees';
import { useVoteUserPower } from './useVoteUserPower';
import { useVoteUserSlopes } from './useVoteUserSlopes';

// seconds in a week / 12 seconds (approx time
// when Ethereum blockchain produces a new block)
const BLOCKS_IN_A_WEEK = 50400;
// TODO: update when contract is deployed
const CONTRACT_DEPLOY_BLOCK = 20009990;

// TODO: if voted any time last week, need to consider
// "prev" as this week's Monday
// currently it's a week before today
const getPrevVotesBlock = (blockNumber: bigint) => {
  const lastWeekBlock = Number(blockNumber) - BLOCKS_IN_A_WEEK;
  return BigInt(Math.max(CONTRACT_DEPLOY_BLOCK, lastWeekBlock));
};

export const useFetchUserVotes = () => {
  const dispatch = useAppDispatch();
  const { account } = useAppSelector((state) => state.setup);
  const { lastUserVote, isUserVotesLoading } = useAppSelector((state) => state.govern);

  const { data: nominees } = useNominees();
  const { data: userPower } = useVoteUserPower(account);
  const { data: block } = useBlock({ blockTag: 'latest', scopeKey: LATEST_BLOCK_KEY });
  const { data: userSlopesCurrent } = useVoteUserSlopes(
    nominees || [],
    account || null,
    block ? getPrevVotesBlock(block.number) : null,
    userPower ? Number(userPower) !== 0 : false,
  );
  const { data: userSlopesNext } = useVoteUserSlopes(
    nominees || [],
    account || null,
    block ? block.number : null,
    userPower ? Number(userPower) !== 0 : false,
    NEXT_USERS_SLOPES_KEY,
  );
  const { data: lastVoteData } = useLastUserVote(
    nominees || [],
    account || null,
    userPower ? Number(userPower) !== 0 : false,
  );

  /**
   * Sets user slopes to the store
   **/
  useEffect(() => {
    if (
      // check if all data is loaded
      !nominees ||
      userPower === undefined ||
      // and if it's not yet in store
      !isUserVotesLoading
    ) {
      return;
    }
    // If user power is 0, it means user didn't vote
    // set user votes as {} as
    if (Number(userPower) === 0) {
      dispatch(setUserVotes({}));
    } else if (userSlopesNext && userSlopesCurrent && lastUserVote !== undefined) {
      const result: Record<string, UserVotes> = {};
      nominees.forEach((item, index) => {
        if (
          userSlopesCurrent[index].status === 'success' &&
          userSlopesNext[index].status === 'success'
        ) {
          const [slope, power, end] = userSlopesCurrent[index].result as number[];
          const [slopeNext, powerNext, endNext] = userSlopesNext[index].result as number[];
          if (power || powerNext)
            result[item.account] = {
              current: {
                slope: Number(slope),
                power: Number(power) / 100,
                end: Number(end),
              },
              next: {
                slope: Number(slopeNext),
                power: Number(powerNext) / 100,
                end: Number(endNext),
              },
            };
        }
      });
      dispatch(setUserVotes(result));
    }
  }, [
    dispatch,
    isUserVotesLoading,
    lastUserVote,
    nominees,
    userPower,
    userSlopesCurrent,
    userSlopesNext,
  ]);

  /**
   * Sets user last vote timestamp to the store
   **/
  useEffect(() => {
    if (lastVoteData !== undefined && lastUserVote === null) {
      dispatch(setLastUserVote(lastVoteData * 1000));
    }
  }, [dispatch, lastUserVote, lastVoteData]);
};
