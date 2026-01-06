// import Dashboard from 'components/Dashboard';
// export default Dashboard;
// NOTE: leaderboard will be the default page until further notice
import Meta from 'components/meta';
import { Leaderboard } from 'components/Leaderboard';

const Index = () => (
  <>
    <Meta
      pageTitle={null}
      description="Contribute to the Olas DAO by completing actions, earning points, climbing the rankings and upgrading your badge. View the leaderboard and compete with other contributors."
      pageUrl=""
    />
    <Leaderboard />
  </>
);

export default Index;
