import { createSnapshotGetStaticProps } from 'libs/util-ssr/src';

import { BondingProducts } from 'components/BondingProducts/BondingProducts';
import { ProductsSummary } from 'components/BondingProducts/ProductsSummary';
import { Meta } from 'components/Meta';
import { fetchBondingProducts } from 'common-util/functions/fetchBondingProducts';

/** Depository reads plus LP pricing across several chains and two subgraphs. */
const ISR_TIMEOUT_MS = 45_000;
const REVALIDATE_SECONDS = 300;
const REVALIDATE_ON_ERROR_SECONDS = 60;

/**
 * The visible table loads its rows in the browser. Rather than unpick that, the same product
 * list is fetched here and rendered as hidden text, so the page serves its products to crawlers
 * while the interactive table is untouched. See ProductsSummary for why it is hidden.
 */
export const getStaticProps = createSnapshotGetStaticProps({
  fetchSnapshot: () => fetchBondingProducts({ isActive: true }),
  emptyValue: [],
  timeoutMs: ISR_TIMEOUT_MS,
  revalidateSeconds: REVALIDATE_SECONDS,
  revalidateOnErrorSeconds: REVALIDATE_ON_ERROR_SECONDS,
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
