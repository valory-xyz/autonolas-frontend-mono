import dynamic from 'next/dynamic';

import { Meta } from '../../components/Meta';

const HomePage = dynamic(() => import('../../components/HomePage'), {
  ssr: false,
});

const NetworkHome = ({ network }) => {
  return (
    <>
      <Meta
        description="Browse autonomous AI agents on different blockchain networks. Discover and manage agents from the Olas on-chain registry."
        pageUrl={network || ''}
      />
      <HomePage />
    </>
  );
};

export const getServerSideProps = async (context) => {
  const { network } = context.params;

  return {
    props: {
      network,
    },
  };
};

export default NetworkHome;
