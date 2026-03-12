import { Leaderboard } from 'components/Leaderboard';
import Meta from 'components/meta';

const LeaderboardPage = () => (
  <>
    <Meta
      pageTitle="Leaderboard"
      description="View the Olas Contribute leaderboard. See top contributors ranked by points, track your position, and discover who's leading the community."
      pageUrl="leaderboard"
    />
    <Leaderboard />
  </>
);

export default LeaderboardPage;
