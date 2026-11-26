import { getBlockRanges } from './blockRanges';

describe('getBlockRanges', () => {
  it('returns one window when the range fits', () => {
    expect(getBlockRanges(BigInt(100), BigInt(150), BigInt(100))).toEqual([
      { fromBlock: BigInt(100), toBlock: BigInt(150) },
    ]);
  });

  it('counts both ends, so a span of exactly maxSpan blocks is one window', () => {
    expect(getBlockRanges(BigInt(1), BigInt(10), BigInt(10))).toEqual([
      { fromBlock: BigInt(1), toBlock: BigInt(10) },
    ]);
    expect(getBlockRanges(BigInt(1), BigInt(11), BigInt(10))).toEqual([
      { fromBlock: BigInt(1), toBlock: BigInt(10) },
      { fromBlock: BigInt(11), toBlock: BigInt(11) },
    ]);
  });

  it('covers the whole range with contiguous windows no wider than maxSpan', () => {
    const from = BigInt(58_661_778);
    const to = BigInt(123_068_827);
    const maxSpan = BigInt(10_000_000);
    const ranges = getBlockRanges(from, to, maxSpan);

    expect(ranges).toHaveLength(7);
    expect(ranges[0].fromBlock).toBe(from);
    expect(ranges[ranges.length - 1].toBlock).toBe(to);
    ranges.forEach((range) => {
      expect(range.toBlock - range.fromBlock + BigInt(1) <= maxSpan).toBe(true);
    });
    ranges.slice(1).forEach((range, i) => {
      expect(range.fromBlock).toBe(ranges[i].toBlock + BigInt(1));
    });
  });

  it('returns no windows when fromBlock is after toBlock', () => {
    expect(getBlockRanges(BigInt(10), BigInt(9), BigInt(5))).toEqual([]);
  });

  it('rejects a non-positive maxSpan', () => {
    expect(() => getBlockRanges(BigInt(1), BigInt(2), BigInt(0))).toThrow('maxSpan');
  });
});
