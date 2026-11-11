import type { Address } from 'viem';

import type { StakingContract } from 'types';

import { buildClaimBatches, getCursorChange } from './claim-batches';

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

describe('getCursorChange', () => {
  const cursors = { [A]: 9, [B]: 9 };

  it('reports a staking contract the batches were not built from as concurrent', () => {
    // C has no expected cursor to compare against, so its claim cannot be one of the user's.
    expect(getCursorChange(cursors, cursors, { ...cursors, [C]: 3 })).toBe('concurrent');
  });
});
