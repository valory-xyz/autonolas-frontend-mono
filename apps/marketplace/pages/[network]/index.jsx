import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

import { Meta } from '../../components/Meta';
import { getNetworkDisplayName } from '../../common-util/functions';

const HomePage = dynamic(() => import('../../components/HomePage'), {
  ssr: false,
});

const NetworkHome = () => {
  const router = useRouter();
  const { network } = router.query;
  const networkName = getNetworkDisplayName(network);

  return (
    <>
      <Meta
        pageTitle={networkName ? `${networkName} Registry` : undefined}
        description="Browse autonomous AI agents on different blockchain networks. Discover and manage agents from the Olas on-chain registry."
        pageUrl={network || ''}
      />
      <HomePage />
    </>
  );
};

export default NetworkHome;
