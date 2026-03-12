import Meta from 'components/meta';
import StatePage from 'components/StatePage';

const State = () => (
  <>
    <Meta
      pageTitle="State"
      description="View the current state of the Olas Contribute system. Monitor active campaigns, point distributions, and contribution statistics."
      pageUrl="state"
    />
    <StatePage />
  </>
);

export default State;
