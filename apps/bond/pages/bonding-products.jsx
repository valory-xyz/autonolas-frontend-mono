import { BondingProducts } from 'components/BondingProducts/BondingProducts';
import { Meta } from 'components/Meta';

const BondingProductsPage = () => (
  <>
    <Meta
      pageTitle="Bonding Products"
      description="Browse available bonding products to get discounted OLAS. Bond your capital into the Olas protocol and receive discounted OLAS tokens in return."
      pageUrl="bonding-products"
    />
    <BondingProducts />
  </>
);

export default BondingProductsPage;
