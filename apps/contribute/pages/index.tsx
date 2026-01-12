// import Dashboard from 'components/Dashboard';
// export default Dashboard;
// NOTE: leaderboard will be the default page until further notice
import { Leaderboard } from 'components/Leaderboard';
import Meta from 'components/meta';

const Index = () => (
  <>
    <Meta description="Contribute to the Olas DAO by completing actions, earning points, climbing the rankings and upgrading your badge. View the leaderboard and compete with other contributors." />
    <Leaderboard />
  </>
);

export default Index;
