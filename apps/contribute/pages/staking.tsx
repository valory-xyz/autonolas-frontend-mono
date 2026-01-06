import Meta from 'components/meta';
import { StakingPage } from 'components/Staking';

const Staking = () => (
  <>
    <Meta
      pageTitle="Staking"
      description="Stake your OLAS tokens to earn rewards and participate in driving attention for Olas. View staking opportunities, track your positions, and manage your stakes."
      pageUrl="staking"
    />
    <StakingPage />
  </>
);

export default Staking;
