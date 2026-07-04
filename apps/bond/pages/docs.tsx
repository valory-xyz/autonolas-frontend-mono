import { DocsPage } from 'components/Docs';
import { Meta } from 'components/Meta';

const Docs = () => (
  <>
    <Meta
      pageTitle="Documentation"
      description="Learn how Olas Bond works: bonding mechanics, bond pricing at a discount or premium, and vesting schedules."
      pageUrl="docs"
    />
    <DocsPage />
  </>
);

export default Docs;
