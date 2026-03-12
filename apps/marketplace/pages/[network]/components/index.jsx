import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

import { Meta } from '../../../components/Meta';

const ListComponents = dynamic(() => import('../../../components/ListComponents'), {
  ssr: false,
});

const Components = () => {
  const router = useRouter();
  const { network } = router.query;

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

export default Components;
