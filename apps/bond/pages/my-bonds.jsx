import { Meta } from 'components/Meta';
import { MyBonds } from 'components/MyBonds/MyBonds';

const MyBondsPage = () => (
  <>
    <Meta
      pageTitle="My Bonds"
      description="View and manage your bonding positions. Track your bonds, claim vested OLAS tokens, and monitor your discounts and maturity dates."
      pageUrl="my-bonds"
    />
    <MyBonds />
  </>
);

export default MyBondsPage;
