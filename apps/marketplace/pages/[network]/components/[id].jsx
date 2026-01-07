import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

import { Meta } from '../../../components/Meta';

const ComponentDetails = dynamic(() => import('../../../components/ListComponents/details'), {
  ssr: false,
});

const ComponentDetailsPage = () => {
  const router = useRouter();
  const { network, id } = router.query;

  return (
    <>
      <Meta
        pageTitle="Component Details"
        description="View detailed information about this component including its functionality, dependencies, and on-chain registration details."
        pageUrl={`${network || ''}/components/${id || ''}`}
      />
      <ComponentDetails />
    </>
  );
};

export default ComponentDetailsPage;
