import { useEffect } from 'react';
import { UserVotes } from 'types';
import { useAccount, useBlock } from 'wagmi';

import { LATEST_BLOCK_KEY, NEXT_USERS_SLOPES_KEY } from 'common-util/constants/scopeKeys';
import { getThisWeekMondayTimestamp } from 'common-util/functions/time';
import { setLastUserVote, setUserVotes } from 'store/govern';
import { useAppDispatch, useAppSelector } from 'store/index';

import { useLastUserVote } from './useLastUserVote';
import { useNominees } from './useNominees';
import { useVoteUserPower } from './useVoteUserPower';
import { useVoteUserSlopes } from './useVoteUserSlopes';

// approx time when Ethereum blockchain produces a new block
const SECONDS_PER_BLOCK = 12;
// TODO: update when contract is deployed
const CONTRACT_DEPLOY_BLOCK = 20009990;

// Current votes are those that have been applied at the start of the week
const getCurrentVotesBlock = (blockNumber: bigint, blockTimestamp: bigint) => {
  const mondayBlock =
    Number(blockNumber) -
    // Approx number of blocks between current timestamp and this Monday
    Math.round((Number(blockTimestamp) - getThisWeekMondayTimestamp()) / SECONDS_PER_BLOCK);

  return BigInt(Math.max(CONTRACT_DEPLOY_BLOCK, mondayBlock));
};

export const useFetchUserVotes = () => {
  const dispatch = useAppDispatch();
  const { address: account } = useAccount();
  const { lastUserVote, isUserVotesLoading } = useAppSelector((state) => state.govern);

  const { data: nominees } = useNominees();

  // Get user's total allocated power
  const { data: userPower } = useVoteUserPower(account);

  const { data: block } = useBlock({ blockTag: 'latest', scopeKey: LATEST_BLOCK_KEY });

  // Get current user's votes for all nominees
  const { data: userSlopesCurrent } = useVoteUserSlopes(
    nominees || [],
    account || null,
    block ? getCurrentVotesBlock(block.number, block.timestamp) : null,
    userPower ? Number(userPower) !== 0 : false,
  );

  // Get next user's votes for all nominees
  const { data: userSlopesNext } = useVoteUserSlopes(
    nominees || [],
    account || null,
    block ? block.number : null,
    userPower ? Number(userPower) !== 0 : false,
    NEXT_USERS_SLOPES_KEY,
  );

  // Get user's last vote timestamp
  const { data: lastVoteData } = useLastUserVote(
    nominees || [],
    account || null,
    userPower ? Number(userPower) !== 0 : false,
  );

  /**
   * Sets user's slopes to the store
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
    // set user votes as {}
    if (Number(userPower) === 0) {
      dispatch(setUserVotes({}));
    } else if (userSlopesNext && userSlopesCurrent && lastUserVote) {
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
