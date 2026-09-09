import PropTypes from 'prop-types';

import { formatUtcTimestamp } from 'libs/util-functions/src';

/**
 * A server-rendered copy of the bonding products, hidden from view.
 *
 * The visible table loads its rows in the browser, so a crawler fetching this page received the
 * table headers and an empty state. This puts the same products into the HTML as text.
 *
 * `hidden` rather than `.sr-only`: the interactive table renders the same products once loaded,
 * so exposing both to assistive tech would announce every product twice. `hidden` keeps them in
 * the markup for crawlers while removing them from the visual render and the accessibility tree.
 *
 * Solana products carry no `fullCurrentPriceLp` here — that price comes from a wallet-adapter
 * hook with no server equivalent — so their price is omitted rather than shown as zero.
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
