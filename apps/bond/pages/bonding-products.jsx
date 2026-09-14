import { createSnapshotGetStaticProps } from 'libs/util-ssr/src';

import { BondingProducts } from 'components/BondingProducts/BondingProducts';
import { ProductsSummary } from 'components/BondingProducts/ProductsSummary';
import { Meta } from 'components/Meta';
import { fetchBondingProducts } from 'common-util/functions/fetchBondingProducts';

/** Depository reads plus LP pricing across several chains and two subgraphs. */
const ISR_TIMEOUT_MS = 45_000;

/** The visible table is client-only, so the same products are served as hidden text for crawlers. */
export const getStaticProps = createSnapshotGetStaticProps({
  fetchSnapshot: () => fetchBondingProducts({ isActive: true }),
  emptyValue: [],
  timeoutMs: ISR_TIMEOUT_MS,
  label: 'bond/bonding-products',
  toProps: ({ data, generatedAt }) => ({
    initialProducts: data,
    snapshotGeneratedAt: generatedAt,
  }),
});

const BondingProductsPage = ({ initialProducts, snapshotGeneratedAt }) => (
  <>
    <Meta
      pageTitle="Bonding Products"
      description="Browse available bonding products to get discounted OLAS. Bond your capital into the Olas protocol and receive discounted OLAS tokens in return."
      pageUrl="bonding-products"
    />
    <ProductsSummary products={initialProducts} snapshotGeneratedAt={snapshotGeneratedAt} />
    <BondingProducts />
  </>
);

export default BondingProductsPage;
