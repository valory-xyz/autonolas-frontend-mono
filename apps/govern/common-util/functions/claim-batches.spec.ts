import type { Address } from 'viem';

import type { StakingContract } from 'types';

import {
  buildClaimBatches,
  getCursorChange,
  claimedThroughOf,
  getExpectedCursors,
} from './claim-batches';

const A: Address = '0x000000000000000000000000000000000000000a';
const B: Address = '0x000000000000000000000000000000000000000b';
const C: Address = '0x000000000000000000000000000000000000000c';

const nominee = (address: Address, chainId: number) =>
  ({ address, chainId }) as unknown as StakingContract;

describe('buildClaimBatches', () => {
  const nominees = [nominee(B, 100), nominee(A, 100), nominee(C, 42161)];
  const relativeWeights = { [A]: 5, [B]: 5, [C]: 5 };

  it('groups claimable nominees by chain, sorted, one epoch per batch', () => {
    const batches = buildClaimBatches({
      nominees,
      lastClaimedEpochs: { [A]: 9, [B]: 8, [C]: 9 },
      currentEpoch: 10,
      minStakingWeight: 1,
      relativeWeights,
    });

    expect(batches).toEqual([
      [
        [100, 42161],
        [[A, B], [C]],
      ],
      [[100], [[B]]],
    ]);
  });

  it('drops nominees whose cursor already reached the current epoch', () => {
    const batches = buildClaimBatches({
      nominees,
      lastClaimedEpochs: { [A]: 10, [B]: 10, [C]: 9 },
      currentEpoch: 10,
      minStakingWeight: 1,
      relativeWeights,
    });

    expect(batches).toEqual([[[42161], [[C]]]]);
  });

  it.each([
    ['vote weight', { relativeWeights: { [A]: 5, [B]: 5 } }],
    ['claim cursor', { lastClaimedEpochs: { [A]: 9, [B]: 9 } }],
  ])('throws on a nominee with no %s instead of dropping it as claimed', (what, override) => {
    expect(() =>
      buildClaimBatches({
        nominees,
        lastClaimedEpochs: { [A]: 9, [B]: 9, [C]: 9 },
        currentEpoch: 10,
        minStakingWeight: 1,
        relativeWeights,
        ...override,
      }),
    ).toThrow(`Could not read the ${what} of staking contract ${C}`);
  });

  it('drops nominees below the minimum staking weight', () => {
    const batches = buildClaimBatches({
      nominees,
      lastClaimedEpochs: { [A]: 9, [B]: 9, [C]: 9 },
      currentEpoch: 10,
      minStakingWeight: 6,
      relativeWeights: { ...relativeWeights, [C]: 7 },
    });

    expect(batches).toEqual([[[42161], [[C]]]]);
  });
});

describe('buildClaimBatches boundaries', () => {
  it('batches a contract whose weight equals the minimum', () => {
    const batches = buildClaimBatches({
      nominees: [nominee(A, 100)],
      lastClaimedEpochs: { [A]: 9 },
      currentEpoch: 10,
      minStakingWeight: 5,
      relativeWeights: { [A]: 5 },
    });

    expect(batches).toEqual([[[100], [[A]]]]);
  });

  it('splits more than 10 claimable contracts of one chain into batches of 10', () => {
    const addresses = Array.from(
      { length: 11 },
      (_, i) => `0x${(i + 1).toString(16).padStart(40, '0')}` as Address,
    );

    const batches = buildClaimBatches({
      nominees: addresses.map((address) => nominee(address, 100)),
      lastClaimedEpochs: Object.fromEntries(addresses.map((address) => [address, 9])),
      currentEpoch: 10,
      minStakingWeight: 1,
      relativeWeights: Object.fromEntries(addresses.map((address) => [address, 5])),
    });

    expect(batches.map(([chainIds, targets]) => [chainIds, targets[0].length])).toEqual([
      [[100], 10],
      [[100], 1],
    ]);
  });

  it('gives a failed weight read as the cause of the missing weight', () => {
    const readError = new Error('execution reverted');

    const build = () =>
      buildClaimBatches({
        nominees: [nominee(A, 100)],
        lastClaimedEpochs: { [A]: 9 },
        currentEpoch: 10,
        minStakingWeight: 1,
        relativeWeights: {},
        weightReadErrors: { [A]: readError },
      });

    expect(build).toThrow(expect.objectContaining({ cause: readError }));
  });
});

describe('own claims', () => {
  it('expects each cursor at the larger of the built one and the own claim', () => {
    expect(getExpectedCursors({ [A]: 9, [B]: 9 }, { [A]: 11, [B]: 8 })).toEqual({
      [A]: 11,
      [B]: 9,
    });
    expect(getExpectedCursors(null, { [A]: 11 })).toBeNull();
  });

  it('moves each claimed target one epoch past what was expected, skipping unknown ones', () => {
    expect(claimedThroughOf({ [A]: 9, [B]: 9 }, [[100], [[A, C]]])).toEqual({ [A]: 10 });
  });
});

describe('getCursorChange', () => {
  const cursors = { [A]: 9, [B]: 9 };

  it('reports a staking contract the batches were not built from as concurrent', () => {
    // C has no expected cursor to compare against, so its claim cannot be one of the user's.
    expect(getCursorChange(cursors, cursors, { ...cursors, [C]: 3 })).toBe('concurrent');
  });
});
