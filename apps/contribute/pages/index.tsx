import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { lowerCase, orderBy } from 'lodash';

import { withTimeout } from 'libs/util-functions/src';

import { Leaderboard } from 'components/Leaderboard';
import Meta from 'components/meta';
import { getName } from 'common-util/functions';
import { fetchLeaderboardData } from 'common-util/api/fetchLeaderboardData';
import { LeaderboardUser } from 'store/types';

const SSR_TIMEOUT_MS = 8000;

export const getServerSideProps: GetServerSideProps<{
  initialLeaderboard: LeaderboardUser[];
}> = async () => {
  try {
    const agents = await withTimeout(fetchLeaderboardData(), SSR_TIMEOUT_MS);

    // Apply the same filtering as getLeaderboardList (filter zero-points, require wallet_address)
    const usersList: LeaderboardUser[] = [];
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

    // Apply the same ranking as getRankedUsers in store/setup.ts
    const sorted = orderBy(
      usersList,
      [(user) => user.points, (user) => lowerCase(getName(user))],
      ['desc', 'asc'],
    );

    const rankedUsers: LeaderboardUser[] = [];
    sorted.forEach((user, index) => {
      if (index === 0) {
        rankedUsers.push({ ...user, rank: 1 });
      } else {
        const previousUser = rankedUsers[index - 1];
        const rank =
          previousUser.points === user.points ? previousUser.rank : (previousUser.rank || 1) + 1;
        rankedUsers.push({ ...user, rank });
      }
    });

    return { props: { initialLeaderboard: rankedUsers } };
  } catch (error) {
    console.error('SSR leaderboard fetch failed:', error);
    return { props: { initialLeaderboard: [] } };
  }
};

const Index = ({ initialLeaderboard }: InferGetServerSidePropsType<typeof getServerSideProps>) => (
  <>
    <Meta description="Contribute to the Olas DAO by completing actions, earning points, climbing the rankings and upgrading your badge. View the leaderboard and compete with other contributors." />
    <Leaderboard initialLeaderboard={initialLeaderboard} />
  </>
);

export default Index;
