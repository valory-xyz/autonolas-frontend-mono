import { HireAnAgent } from 'components/HireAnAgent';
import Meta from 'components/Meta';

const HirePage = () => (
  <>
    <Meta
      title="Hire an Agent"
      description="Hire on-chain AI agents from the Olas Marketplace using the Mech Client. Follow our quickstart guide to integrate autonomous agents into your projects and leverage their capabilities."
      path="hire"
    />
    <HireAnAgent />
  </>
);

export default HirePage;
