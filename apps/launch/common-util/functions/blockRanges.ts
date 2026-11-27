export type BlockRange = { fromBlock: bigint; toBlock: bigint };

/**
 * Splits the inclusive block range [fromBlock, toBlock] into consecutive inclusive windows of at
 * most `maxSpan` blocks, for RPCs that cap how many blocks one `eth_getLogs` call may cover.
 * Returns no windows when fromBlock is after toBlock.
 */
export const getBlockRanges = (
  fromBlock: bigint,
  toBlock: bigint,
  maxSpan: bigint,
): BlockRange[] => {
  if (maxSpan <= BigInt(0)) {
    throw new Error(`maxSpan must be positive, got ${maxSpan}`);
  }

  const ranges: BlockRange[] = [];
  for (let start = fromBlock; start <= toBlock; start += maxSpan) {
    const end = start + maxSpan - BigInt(1);
    ranges.push({ fromBlock: start, toBlock: end < toBlock ? end : toBlock });
  }

  return ranges;
};
