import { Opportunities } from 'components/Opportunities'; // Import the actual Opportunities component
import Meta from 'components/Meta';

const OpportunitiesPage = () => (
  <>
    <Meta
      title="Opportunities for Olas Agents"
      description="Explore exciting opportunities for Olas agents to join innovative projects."
      url="https://build.olas.network/opportunities"
    />
    <Opportunities />
  </>
);

export default OpportunitiesPage;
