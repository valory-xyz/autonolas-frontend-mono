/**
 * Cuts a product down to what `ProductsSummary` renders, as plain JSON. `getStaticProps` props
 * go through Next's `isSerializableProps`, which throws on the bigints viem returns for
 * `id`, `vesting` and the prices - a build failure the day the list is non-empty, and a
 * revalidation that keeps serving the last snapshot with an error in the logs.
 */
export const toSummaryProduct = (product, id) => ({
  id: String(id),
  lpTokenName: product.lpTokenName ?? null,
  roundedDiscountedOlasPerLpToken: Number(product.roundedDiscountedOlasPerLpToken) || 0,
  fullCurrentPriceLp: Number(product.fullCurrentPriceLp) || 0,
  /** Seconds, as the contract stores it; the summary renders days. */
  vesting: Number(product.vesting) || 0,
  supplyLeft: product.supplyLeft == null ? null : Number(product.supplyLeft),
});
