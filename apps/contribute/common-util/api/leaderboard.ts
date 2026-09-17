import { lowerCase, orderBy } from 'lodash';

import { getName } from 'common-util/functions';
import { LeaderboardUser } from 'store/types';
import { ContributeAgent } from 'types/users';

/**
 * Shared by the browser path below and by `getStaticProps` on the leaderboard page, so the
 * pre-rendered rows and the ones the client later fetches are filtered identically.
 */
export const toLeaderboardUsers = (agents: ContributeAgent[]): LeaderboardUser[] => {
  const usersList: LeaderboardUser[] = [];

  // TODO: consider filtering and convenient mapping
  // right inside the api endpoint
  if (agents && Array.isArray(agents)) {
    agents.forEach((user) => {
      if (!user.json_value.wallet_address) return;
      if (user.json_value.points === 0) return;
      usersList.push({
        ...user.json_value,
        rank: null,
        attribute_id: user.attribute_id,
      });
    });
  }

  return usersList;
};

/** Ranks users by points, then name; equal points share a rank. Used by the store and by the pages that pre-render rows. */
export const getRankedUsers = (leaderboard: LeaderboardUser[]): LeaderboardUser[] => {
  // orderBy (sort) 1. points, 2. name
  const users = orderBy(
    leaderboard,
    [(user) => user.points, (user) => lowerCase(getName(user))],
    ['desc', 'asc'],
  );

  const rankedUsers: LeaderboardUser[] = [];
  users.forEach((user, index) => {
    // setting rank for the first index
    if (index === 0) {
      rankedUsers.push({ ...user, rank: 1 });
    } else {
      const previousUser = rankedUsers[index - 1];
      const rank =
        previousUser.points === user.points ? previousUser.rank : (previousUser.rank || 1) + 1;

      rankedUsers.push({
        ...user,
        rank,
      });
    }
  });

  return rankedUsers;
};

/** What the leaderboard table renders. Server-rendered rows carry only this. */
export type LeaderboardRow = Pick<
  LeaderboardUser,
  'id' | 'rank' | 'points' | 'wallet_address' | 'twitter_handle' | 'discord_handle'
>;

/**
 * Cuts a user down to the table's columns before it goes into the page HTML. The full record
 * carries tweet ids and staking state that the homepage never shows, and 600 of them made the
 * `__NEXT_DATA__` blob most of a 1.8 MB page.
 */
export const toLeaderboardRow = ({
  id,
  rank,
  points,
  wallet_address,
  twitter_handle,
  discord_handle,
}: LeaderboardUser): LeaderboardRow => ({
  id,
  rank,
  points,
  wallet_address,
  twitter_handle,
  discord_handle,
});

export const getLeaderboardList = async () => {
  const response = await fetch('/api/leaderboard');
  const json: ContributeAgent[] = await response.json();
  return toLeaderboardUsers(json);
};

type UpdateUserStakingDataParams = {
  attributeId: number;
  multisig: string;
  serviceId: number;
};

export const updateUserStakingData = async ({
  attributeId,
  multisig,
  serviceId,
}: UpdateUserStakingDataParams): Promise<ContributeAgent> => {
  const response = await fetch('/api/agent-staking', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attributeId, service_multisig: multisig, service_id: serviceId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update staking data: ${response.statusText}`);
  }

  const agent: ContributeAgent = await response.json();
  return agent;
};

export const clearUserOldStakingData = async (attributeId: number) => {
  const response = await fetch('/api/agent-staking', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attributeId, service_multisig_old: null, service_id_old: null }),
  });

  if (!response.ok) {
    throw new Error(`Failed to clear staking data: ${response.statusText}`);
  }

  const agent: ContributeAgent = await response.json();
  return agent;
};
