import dynamic from 'next/dynamic';

import { Meta } from '../../../components/Meta';

const ListComponents = dynamic(() => import('../../../components/ListComponents'), {
  ssr: false,
});

const Components = ({ network }) => {
  return (
    <>
      <Meta
        pageTitle="Components"
        description="Browse reusable components in the Olas registry. Discover building blocks for creating autonomous AI agents."
        pageUrl={`${network || ''}/components`}
      />
      <ListComponents />
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

export default Components;
