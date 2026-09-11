import PropTypes from 'prop-types';

import { formatUtcTimestamp } from 'libs/util-functions/src';

/**
 * A server-rendered copy of the products, for crawlers. `hidden` rather than `.sr-only`: the
 * table renders the same rows once loaded, so both would announce every product twice.
 * Solana products have no server-side price, so a falsy price is omitted rather than shown as 0.
 */
export const ProductsSummary = ({ products = [], snapshotGeneratedAt = null }) => {
  if (products.length === 0) return null;

  const asOf = formatUtcTimestamp(snapshotGeneratedAt);

  return (
    <div hidden>
      <p>
        {`${products.length} active Olas bonding products. Each one exchanges a liquidity-pool token for discounted OLAS: the list gives the LP token, how much OLAS it mints per LP token, the vesting period in seconds and the OLAS supply remaining. `}
        {asOf ? `Server-rendered snapshot taken ${asOf}.` : ''}
      </p>
      <ul>
        {products.map((product) => (
          <li key={String(product.id)}>
            <strong>{product.lpTokenName || `Product ${product.id}`}</strong>
            {` — bond ID ${product.id}`}
            {product.roundedDiscountedOlasPerLpToken
              ? `, ${product.roundedDiscountedOlasPerLpToken} OLAS minted per LP token`
              : ''}
            {product.fullCurrentPriceLp
              ? `, current LP token price ${product.fullCurrentPriceLp}`
              : ''}
            {product.vesting ? `, vesting ${product.vesting} seconds` : ''}
            {product.supplyLeft != null
              ? `, ${Math.round(product.supplyLeft * 100)}% of supply remaining`
              : ''}
            .
          </li>
        ))}
      </ul>
    </div>
  );
};

ProductsSummary.propTypes = {
  products: PropTypes.arrayOf(PropTypes.shape({})),
  snapshotGeneratedAt: PropTypes.string,
};
