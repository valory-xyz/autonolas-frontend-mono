import dynamic from 'next/dynamic';
import { Meta } from '../../../components/Meta';

const ComponentDetails = dynamic(() => import('../../../components/ListComponents/details'), {
  ssr: false,
});

const ComponentDetailsPage = () => (
  <>
    <Meta
      pageTitle="Component Details"
      description="View detailed information about this component including its functionality, dependencies, and on-chain registration details."
      pageUrl="components"
    />
    <ComponentDetails />
  </>
);

export default ComponentDetailsPage;
