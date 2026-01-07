import dynamic from 'next/dynamic';

import { Meta } from '../components/Meta';

const HomePage = dynamic(() => import('../components/HomePage'), {
  ssr: false,
});

const Index = () => (
  <>
    <Meta description="Marketplace to discover, manage, and view activity of autonomous AI agents directly from the Olas on-chain registry." />
    <HomePage />
  </>
);

export default Index;
