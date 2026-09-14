import { Leaderboard } from 'components/Leaderboard';
import Meta from 'components/meta';

import {
  LeaderboardPageProps,
  getLeaderboardStaticProps,
} from 'common-util/api/leaderboardSnapshot';

export const getStaticProps = getLeaderboardStaticProps;

const LeaderboardPage = ({ users, campaigns, snapshotGeneratedAt }: LeaderboardPageProps) => (
  <>
    <Meta
      pageTitle="Leaderboard"
      description="View the Olas Contribute leaderboard. See top contributors ranked by points, track your position, and discover who's leading the community."
      pageUrl="leaderboard"
    />
    <Leaderboard
      initialLeaderboard={users}
      initialCampaigns={campaigns}
      snapshotGeneratedAt={snapshotGeneratedAt}
    />
  </>
);

export default LeaderboardPage;
