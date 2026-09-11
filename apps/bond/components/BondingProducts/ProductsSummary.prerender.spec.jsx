import { renderToString } from 'react-dom/server';

import { ProductsSummary } from './ProductsSummary';

const PRODUCTS = [
  {
    id: 7n,
    lpTokenName: 'OLAS-WXDAI',
    roundedDiscountedOlasPerLpToken: 12.5,
    fullCurrentPriceLp: 40.2,
    vesting: 604800n,
    supplyLeft: 0.75,
  },
  {
    id: 9n,
    lpTokenName: 'WSOL-OLAS',
    roundedDiscountedOlasPerLpToken: 3.1,
    // Solana: no server-side price. Must be omitted, not printed as 0.
    fullCurrentPriceLp: 0,
    vesting: 604800n,
    supplyLeft: 0.5,
  },
];

// `renderToString`, not RTL's `render`: the latter runs effects before asserting, so a component
// that only shows content after mount would pass while serving nothing. This is what a crawler gets.
const serve = (props) => renderToString(<ProductsSummary {...props} />);

describe('ProductsSummary server render', () => {
  it('serves every product by name and id', () => {
    const html = serve({ products: PRODUCTS, snapshotGeneratedAt: null });

    expect(html).toContain('OLAS-WXDAI');
    expect(html).toContain('bond ID 7');
    expect(html).toContain('WSOL-OLAS');
    expect(html).toContain('bond ID 9');
    expect(html).toContain('2 active Olas bonding products');
  });

  it('omits a Solana price rather than publishing 0', () => {
    const html = serve({ products: PRODUCTS, snapshotGeneratedAt: null });

    expect(html).toContain('current LP token price 40.2');
    expect(html).not.toContain('current LP token price 0');
  });

  it('states when the snapshot was taken', () => {
    const html = serve({ products: PRODUCTS, snapshotGeneratedAt: '2026-09-08T14:33:00.000Z' });

    expect(html).toContain('snapshot taken 8 Sep 2026, 14:33 UTC');
  });

  it('serves nothing rather than an empty list when there are no products', () => {
    expect(serve({ products: [], snapshotGeneratedAt: null })).toBe('');
  });
});
