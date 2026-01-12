import { Meta } from 'components/Meta';
import { DonatePage } from 'components/Donate';

const Donate = () => (
  <>
    <Meta
      pageTitle="Donate"
      description="Support Olas services and developers by donating ETH. Your donations help incentivize the creation of valuable code and autonomous services in the Olas ecosystem."
      pageUrl="donate"
    />
    <DonatePage />
  </>
);

export default Donate;
