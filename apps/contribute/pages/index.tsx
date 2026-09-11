import { Leaderboard } from 'components/Leaderboard';
import Meta from 'components/meta';

import {
  LeaderboardPageProps,
  getLeaderboardStaticProps,
} from 'common-util/api/leaderboardSnapshot';

/** Same snapshot as `/leaderboard`: this page renders the same thing. */
export const getStaticProps = getLeaderboardStaticProps;

const Index = ({ users, campaigns, snapshotGeneratedAt }: LeaderboardPageProps) => (
  <>
    <Meta description="Contribute to the Olas DAO by completing actions, earning points, climbing the rankings and upgrading your badge. View the leaderboard and compete with other contributors." />
    <Leaderboard
      initialLeaderboard={users}
      initialCampaigns={campaigns}
      snapshotGeneratedAt={snapshotGeneratedAt}
    />
  </>
);

export default Index;
