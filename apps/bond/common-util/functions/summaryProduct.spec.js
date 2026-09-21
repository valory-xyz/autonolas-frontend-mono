import { isSerializableProps } from 'next/dist/lib/is-serializable-props';

import { toSummaryProduct } from './summaryProduct';

// What viem hands back for a product (minus `token`, which the conversion never reads): bigints
// for the ids, vesting and prices. This is the exact
// shape Next's `isSerializableProps` rejects, so `getStaticProps` must never see it as-is.
const RAW_PRODUCT = {
  id: 7n,
  key: 7n,
  discount: 12.5,
  priceLp: 40200000000000000000n,
  vesting: 604800n,
  supply: 1000000000000000000000n,
  currentPriceLp: 80400000000000000000n,
  lpTokenName: 'OLAS-WXDAI',
  fullCurrentPriceLp: 40.2,
  roundedDiscountedOlasPerLpToken: 12.5,
  projectedChange: -68.9,
  supplyLeft: 0.75,
};

describe('the pre-rendered products survive Next serialisation', () => {
  it('rejects the raw viem shape, which is why the summary shape exists', () => {
    expect(() =>
      isSerializableProps('/bonding-products', 'getStaticProps', {
        initialProducts: [RAW_PRODUCT],
      }),
    ).toThrow(/initialProducts\[0\]\.id/);
  });

  it('accepts what fetchBondingProducts actually returns', () => {
    const props = {
      initialProducts: [toSummaryProduct(RAW_PRODUCT, RAW_PRODUCT.id)],
      snapshotGeneratedAt: '2026-09-21T10:00:00.000Z',
    };

    expect(isSerializableProps('/bonding-products', 'getStaticProps', props)).toBe(true);
    expect(JSON.parse(JSON.stringify(props.initialProducts[0]))).toEqual({
      id: '7',
      lpTokenName: 'OLAS-WXDAI',
      roundedDiscountedOlasPerLpToken: 12.5,
      fullCurrentPriceLp: 40.2,
      vesting: 604800,
      supplyLeft: 0.75,
    });
  });
});
