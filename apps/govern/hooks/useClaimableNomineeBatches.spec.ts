import type { Address } from 'viem';

import type { StakingContract } from 'types';

import { buildClaimBatches } from './useClaimableNomineeBatches';

jest.mock('wagmi', () => ({ useReadContract: jest.fn(), useReadContracts: jest.fn() }));
jest.mock('@tanstack/react-query', () => ({ useQueryClient: jest.fn() }));
jest.mock('store/index', () => ({ useAppSelector: jest.fn() }));
jest.mock('hooks/useNomineesWeights', () => ({ useNomineesWeights: jest.fn() }));
jest.mock('components/Donate/hooks', () => ({
  useEpochCounter: jest.fn(),
  useEpochTokenomics: jest.fn(),
}));

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
