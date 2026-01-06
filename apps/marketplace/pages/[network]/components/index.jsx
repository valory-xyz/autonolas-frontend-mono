import dynamic from 'next/dynamic';
import { Meta } from '../../../components/Meta';

const ListComponents = dynamic(() => import('../../../components/ListComponents'), {
  ssr: false,
});

const Components = () => (
  <>
    <Meta
      pageTitle="Components"
      description="Browse reusable components in the Olas registry. Discover building blocks for creating autonomous AI agents."
      pageUrl="components"
    />
    <ListComponents />
  </>
);

export default Components;
