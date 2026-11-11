import { renderHook } from '@testing-library/react';
import { type Address, BaseError } from 'viem';
import { useReadContract, useReadContracts } from 'wagmi';

import { useAppSelector } from 'store/index';
import { useNomineesWeights } from 'hooks/useNomineesWeights';
import { useEpochCounter, useEpochTokenomics } from 'components/Donate/hooks';
import type { StakingContract } from 'types';

import { buildClaimBatches, useClaimableNomineesBatches } from './useClaimableNomineeBatches';

jest.mock('wagmi', () => ({ useReadContract: jest.fn(), useReadContracts: jest.fn() }));
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ removeQueries: jest.fn() }),
}));
jest.mock('store/index', () => ({ useAppSelector: jest.fn() }));
jest.mock('common-util/functions/nominee-hash', () => ({ getNomineeHash: () => '0xhash' }));
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

describe('useClaimableNomineesBatches refetchClaimableBatches', () => {
  const nominees = [nominee(A, 100), nominee(B, 100)];
  const cursorReads = (a: number, b: number) => [
    { status: 'success', result: BigInt(a) },
    { status: 'success', result: BigInt(b) },
  ];
  const mockRefetch = jest.fn();

  const renderBatches = ({
    epoch = 10,
    reads = cursorReads(9, 9),
  }: { epoch?: number | null; reads?: unknown } = {}) => {
    jest
      .mocked(useAppSelector)
      .mockImplementation((selector) =>
        selector({ govern: { stakingContracts: nominees } } as never),
      );
    jest.mocked(useEpochCounter).mockReturnValue({ data: epoch, isLoading: false } as never);
    jest.mocked(useEpochTokenomics).mockReturnValue({ data: { endTime: 1 } } as never);
    jest.mocked(useReadContract).mockReturnValue({ data: 100, isLoading: false } as never);
    jest.mocked(useReadContracts).mockReturnValue({
      data: reads,
      isLoading: false,
      queryKey: ['cursors'],
      refetch: mockRefetch,
    } as never);
    jest.mocked(useNomineesWeights).mockReturnValue({
      data: { [A]: { percentage: 5 }, [B]: { percentage: 5 } },
    } as never);
    return renderHook(() => useClaimableNomineesBatches()).result;
  };

  beforeEach(() => jest.clearAllMocks());

  it('rebuilds the batches from fresh cursors and reports that one moved', async () => {
    const result = renderBatches();
    expect(result.current.nomineesToClaimBatches).toEqual([[[100], [[A, B]]]]);
    mockRefetch.mockResolvedValue({ data: cursorReads(10, 9) });

    const refresh = await result.current.refetchClaimableBatches();

    expect(mockRefetch).toHaveBeenCalledWith({ throwOnError: true });
    expect(refresh).toEqual({
      batches: [[[100], [[B]]]],
      change: 'concurrent',
    });
  });

  it('reports unchanged cursors when nobody claimed meanwhile', async () => {
    const result = renderBatches();
    mockRefetch.mockResolvedValue({ data: cursorReads(9, 9) });

    const refresh = await result.current.refetchClaimableBatches();

    expect(refresh).toEqual({
      batches: [[[100], [[A, B]]]],
      change: 'none',
    });
  });

  it('throws on a failed cursor read instead of treating the nominee as claimed', async () => {
    const result = renderBatches();
    mockRefetch.mockResolvedValue({
      data: [
        { status: 'success', result: BigInt(9) },
        { status: 'failure', error: new Error() },
      ],
    });

    await expect(result.current.refetchClaimableBatches()).rejects.toThrow(
      `Could not read the claim cursor of staking contract ${B}`,
    );
  });

  it('throws while the claim data is still loading instead of returning no batches', async () => {
    const result = renderBatches({ epoch: null });

    await expect(result.current.refetchClaimableBatches()).rejects.toThrow('still loading');
    expect(mockRefetch).not.toHaveBeenCalled();
  });

  it('reports a cursor moved since the last refresh, and not again on the next one', async () => {
    const result = renderBatches();
    mockRefetch.mockResolvedValue({ data: cursorReads(10, 9) });

    const first = await result.current.refetchClaimableBatches();
    const second = await result.current.refetchClaimableBatches();

    expect(first.change).toBe('concurrent');
    expect(second.change).toBe('none');
  });

  it('reports moved cursors when there was nothing to compare against', async () => {
    const result = renderBatches({ reads: null });
    mockRefetch.mockResolvedValue({ data: cursorReads(9, 9) });

    const refresh = await result.current.refetchClaimableBatches();

    expect(refresh.change).toBe('concurrent');
  });

  it('does not count the cursors of a recorded own claim as moved', async () => {
    const result = renderBatches();
    result.current.recordClaimedBatch([[100], [[A]]]);
    mockRefetch.mockResolvedValue({ data: cursorReads(10, 9) });

    const refresh = await result.current.refetchClaimableBatches();

    // Not a concurrent claim, but the claimed nominee drops out, so the modal must restart.
    expect(refresh.change).toBe('own-claims');
    expect(refresh.batches).toEqual([[[100], [[B]]]]);
  });

  it('adds up own claims of one nominee across a multi-epoch backlog', async () => {
    const result = renderBatches({ reads: cursorReads(9, 8) });
    result.current.recordClaimedBatch([[100], [[A, B]]]);
    result.current.recordClaimedBatch([[100], [[B]]]);
    mockRefetch.mockResolvedValueOnce({ data: cursorReads(10, 10) });
    mockRefetch.mockResolvedValueOnce({ data: cursorReads(10, 11) });

    const ownClaimsOnly = await result.current.refetchClaimableBatches();
    const someoneElseToo = await result.current.refetchClaimableBatches();

    expect(ownClaimsOnly.change).toBe('own-claims');
    expect(someoneElseToo.change).toBe('concurrent');
  });

  it.each([
    ['epoch counter', () => jest.mocked(useEpochCounter)],
    ['minimum staking weight', () => jest.mocked(useReadContract)],
    ['previous epoch', () => jest.mocked(useEpochTokenomics)],
    ['nominee weights', () => jest.mocked(useNomineesWeights)],
  ])('exposes a failed %s read instead of showing everything claimed', (_, hook) => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const readError = new BaseError('RPC request failed.');
    const result = renderBatches();
    hook().mockReturnValue({ data: undefined, isLoading: false, error: readError } as never);

    const { result: failed } = renderHook(() => useClaimableNomineesBatches());

    expect(result.current.claimableBatchesError).toBeNull();
    expect(failed.current.claimableBatchesError).toBe('RPC request failed.');
    expect(console.error).toHaveBeenCalledWith(
      'Could not read the claimable staking contracts',
      readError,
    );
  });

  it('treats a cursor below what own claims explain as a lagging read, not a claim', async () => {
    const result = renderBatches();
    result.current.recordClaimedBatch([[100], [[A]]]);
    // The RPC has not caught up with the own claim yet: A still reads 9.
    mockRefetch.mockResolvedValue({ data: cursorReads(9, 9) });

    const refresh = await result.current.refetchClaimableBatches();

    expect(refresh.change).toBe('none');
  });

  it('exposes one nominee whose weight read failed instead of crashing', () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const result = renderBatches();
    // The weights read allows failures, so B is simply missing from its result.
    jest.mocked(useNomineesWeights).mockReturnValue({
      data: { [A]: { percentage: 5 } },
      error: null,
    } as never);

    const { result: partial } = renderHook(() => useClaimableNomineesBatches());

    expect(result.current.claimableBatchesError).toBeNull();
    expect(partial.current.nomineesToClaimBatches).toEqual([]);
    expect(partial.current.claimableBatchesError).toBe(
      `Could not read the vote weight of staking contract ${B}`,
    );
  });

  it('exposes a failed first cursor read instead of dropping the staking contract', () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const result = renderBatches({
      reads: [
        { status: 'success', result: BigInt(9) },
        { status: 'failure', error: new Error() },
      ],
    });

    expect(result.current.nomineesToClaimBatches).toEqual([]);
    expect(result.current.claimableBatchesError).toBe(
      `Could not read the claim cursor of staking contract ${B}`,
    );
  });
});
