import dynamic from 'next/dynamic';

import { Meta } from '../../components/Meta';

const HomePage = dynamic(() => import('../../components/HomePage'), {
  ssr: false,
});

const NetworkHome = () => (
  <>
    <Meta description="Browse autonomous AI agents on different blockchain networks. Discover and manage agents from the Olas on-chain registry." />
    <HomePage />
  </>
);

export default NetworkHome;
