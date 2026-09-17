import { GetServerSideProps, InferGetServerSidePropsType } from 'next';

import { withTimeout } from 'libs/util-functions/src';

import { Leaderboard } from 'components/Leaderboard';
import Meta from 'components/meta';
import { fetchLeaderboardData } from 'common-util/api/fetchLeaderboardData';
import {
  LeaderboardRow,
  getRankedUsers,
  toLeaderboardRow,
  toLeaderboardUsers,
} from 'common-util/api/leaderboard';
import { SSR_TIMEOUT_MS } from 'util/constants';

export const getServerSideProps: GetServerSideProps<{
  initialLeaderboard: LeaderboardRow[];
}> = async () => {
  try {
    const agents = await withTimeout(fetchLeaderboardData(), SSR_TIMEOUT_MS);
    // The same filter and ranking the client applies once its own fetch lands.
    const rankedUsers = getRankedUsers(toLeaderboardUsers(agents));
    return { props: { initialLeaderboard: rankedUsers.map(toLeaderboardRow) } };
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
