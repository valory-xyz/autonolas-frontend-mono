import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react';
import { type Address, BaseError } from 'viem';
import { useReadContract, useReadContracts } from 'wagmi';

import { governReducer, recordOwnClaims, setStakingContracts } from 'store/govern';
import type { ClaimBatch } from 'common-util/functions/staking-incentives-claim';
import { useNomineesWeights } from 'hooks/useNomineesWeights';
import { useEpochCounter, useEpochTokenomics } from 'components/Donate/hooks';
import type { StakingContract } from 'types';

import { useClaimableNomineesBatches } from './useClaimableNomineeBatches';

jest.mock('wagmi', () => ({ useReadContract: jest.fn(), useReadContracts: jest.fn() }));
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ removeQueries: jest.fn() }),
}));
jest.mock('common-util/functions/nominee-hash', () => ({ getNomineeHash: () => '0xhash' }));
jest.mock('hooks/useNomineesWeights', () => ({ useNomineesWeights: jest.fn() }));
jest.mock('components/Donate/hooks', () => ({
  useEpochCounter: jest.fn(),
  useEpochTokenomics: jest.fn(),
}));

const A: Address = '0x000000000000000000000000000000000000000a';
const B: Address = '0x000000000000000000000000000000000000000b';

const nominee = (address: Address, chainId: number) =>
  ({ address, chainId }) as unknown as StakingContract;

describe('useClaimableNomineesBatches refetchClaimableBatches', () => {
  const nominees = [nominee(A, 100), nominee(B, 100)];
  const cursorReads = (a: number, b: number) => [
    { status: 'success', result: BigInt(a) },
    { status: 'success', result: BigInt(b) },
  ];
  const mockRefetch = jest.fn();
  // One store per test, shared by every mount in it, as the app shares one across modal reopens.
  let store = configureStore({ reducer: { govern: governReducer } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  const renderBatchesHook = () => renderHook(() => useClaimableNomineesBatches(), { wrapper });
  /** A confirmed claim of `batch`, recorded as the claim hook does. */
  const recordClaim = (hook: ReturnType<typeof useClaimableNomineesBatches>, batch: ClaimBatch) =>
    store.dispatch(recordOwnClaims(hook.getClaimedThrough(batch)));
  const mockCursorQuery = (data: unknown, error: Error | null = null) =>
    jest.mocked(useReadContracts).mockReturnValue({
      data,
      error,
      isLoading: false,
      queryKey: ['cursors'],
      refetch: mockRefetch,
    } as never);

  const mockBatchReads = ({
    epoch = 10,
    reads = cursorReads(9, 9),
  }: { epoch?: number | null; reads?: unknown } = {}) => {
    jest.mocked(useEpochCounter).mockReturnValue({ data: epoch, isLoading: false } as never);
    jest.mocked(useEpochTokenomics).mockReturnValue({ data: { endTime: 1 } } as never);
    jest.mocked(useReadContract).mockReturnValue({ data: 100, isLoading: false } as never);
    mockCursorQuery(reads);
    jest.mocked(useNomineesWeights).mockReturnValue({
      data: { [A]: { percentage: 5 }, [B]: { percentage: 5 } },
    } as never);
  };
  const renderBatches = (reads?: Parameters<typeof mockBatchReads>[0]) => {
    mockBatchReads(reads);
    return renderBatchesHook().result;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    store = configureStore({ reducer: { govern: governReducer } });
    store.dispatch(setStakingContracts(nominees));
  });

  it('compares against cursors that loaded after the first render', async () => {
    renderBatches({ reads: null });
    const view = renderBatchesHook();
    // The cursors arrive on a later render, as they do in the app.
    mockCursorQuery(cursorReads(9, 9));
    view.rerender();
    act(() => recordClaim(view.result.current, [[100], [[A]]]));

    // A refetch also refills the cache, as the query does in the app.
    mockRefetch.mockImplementation(async () => {
      mockCursorQuery(cursorReads(10, 9));
      return { data: cursorReads(10, 9) };
    });
    const ownClaim = await act(() => view.result.current.refetchClaimableBatches());
    const unchanged = await act(() => view.result.current.refetchClaimableBatches());

    expect(ownClaim.change).toBe('own-claims');
    expect(unchanged.change).toBe('none');
  });

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
    const readError = new Error('execution reverted');
    mockRefetch.mockResolvedValue({
      data: [
        { status: 'success', result: BigInt(9) },
        { status: 'failure', error: readError },
      ],
    });

    const refresh = result.current.refetchClaimableBatches();

    await expect(refresh).rejects.toThrow(
      `Could not read the claim cursor of staking contract ${B}`,
    );
    await expect(refresh).rejects.toHaveProperty('cause', readError);
  });

  it('keeps showing cached cursors when a later cursor query fails', () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    renderBatches();
    mockCursorQuery(cursorReads(9, 9), new BaseError('RPC request failed.'));

    const { result } = renderBatchesHook();

    expect(result.current.claimableBatchesError).toBeNull();
    expect(result.current.nomineesToClaimBatches).toEqual([[[100], [[A, B]]]]);
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
    act(() => recordClaim(result.current, [[100], [[A]]]));
    mockRefetch.mockResolvedValue({ data: cursorReads(10, 9) });

    const refresh = await result.current.refetchClaimableBatches();

    // Not a concurrent claim, but the claimed nominee drops out, so the modal must restart.
    expect(refresh.change).toBe('own-claims');
    expect(refresh.batches).toEqual([[[100], [[B]]]]);
  });

  it('adds up own claims of one nominee across a multi-epoch backlog', async () => {
    const result = renderBatches({ reads: cursorReads(9, 8) });
    act(() => recordClaim(result.current, [[100], [[A, B]]]));
    act(() => recordClaim(result.current, [[100], [[B]]]));
    mockRefetch.mockResolvedValueOnce({ data: cursorReads(10, 10) });
    mockRefetch.mockResolvedValueOnce({ data: cursorReads(10, 11) });

    const ownClaimsOnly = await result.current.refetchClaimableBatches();
    const someoneElseToo = await result.current.refetchClaimableBatches();

    expect(ownClaimsOnly.change).toBe('own-claims');
    expect(someoneElseToo.change).toBe('concurrent');
  });

  it.each([
    ['epoch counter', () => jest.mocked(useEpochCounter)],
    ['claim cursors', () => jest.mocked(useReadContracts)],
    ['minimum staking weight', () => jest.mocked(useReadContract)],
    ['previous epoch', () => jest.mocked(useEpochTokenomics)],
    ['nominee weights', () => jest.mocked(useNomineesWeights)],
  ])('exposes a failed %s read instead of showing everything claimed', (_, hook) => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const readError = new BaseError('RPC request failed.');
    const result = renderBatches();
    hook().mockReturnValue({ data: undefined, isLoading: false, error: readError } as never);

    const { result: failed } = renderBatchesHook();

    expect(result.current.claimableBatchesError).toBeNull();
    expect(failed.current.claimableBatchesError).toBe('RPC request failed.');
    expect(failed.current.isLoadingClaimableBatches).toBe(false);
    expect(console.error).toHaveBeenCalledWith(
      'Could not read the claimable staking contracts',
      readError,
    );
  });

  it('treats a cursor below what own claims explain as a lagging read, not a claim', async () => {
    const result = renderBatches();
    act(() => recordClaim(result.current, [[100], [[A]]]));
    // The RPC has not caught up with the own claim yet: A still reads 9.
    mockRefetch.mockResolvedValue({ data: cursorReads(9, 9) });

    // The list was built before the claim, so the first lagging read rebuilds it; the next one,
    // with the claim already applied, changes nothing. Neither counts as someone else's claim.
    const lagging = await act(() => result.current.refetchClaimableBatches());
    const laggingAgain = await act(() => result.current.refetchClaimableBatches());
    mockRefetch.mockResolvedValue({ data: cursorReads(10, 9) });
    const caughtUp = await act(() => result.current.refetchClaimableBatches());

    expect(lagging.change).toBe('own-claims');
    expect(laggingAgain.change).toBe('none');
    // Once the RPC catches up, the cursor A moved is still the own claim, not someone else's.
    expect(caughtUp.change).toBe('own-claims');
  });

  it('does not offer an epoch an own claim took when the refresh read lags it', async () => {
    const result = renderBatches({ reads: cursorReads(8, 9) });
    act(() => recordClaim(result.current, [[100], [[A, B]]]));
    act(() => recordClaim(result.current, [[100], [[A]]]));
    // The RPC is a block behind the second claim: A still reads 9, though it was claimed to 10.
    mockRefetch.mockResolvedValue({ data: cursorReads(9, 10) });

    const refresh = await result.current.refetchClaimableBatches();

    expect(refresh.change).toBe('own-claims');
    expect(refresh.batches).toEqual([]);
  });

  it('forgets an own claim once a refresh reads it, and keeps one a lagging read missed', async () => {
    const result = renderBatches();
    act(() => recordClaim(result.current, [[100], [[A, B]]]));
    mockRefetch.mockResolvedValue({ data: cursorReads(10, 9) });

    await act(() => result.current.refetchClaimableBatches());

    expect(store.getState().govern.ownClaimedThrough).toEqual({ [B]: 10 });
  });

  it('keeps the shown list as it is when a claim is recorded, until the cursors change', () => {
    mockBatchReads({ reads: cursorReads(9, 8) });
    const view = renderBatchesHook();
    const before = view.result.current.nomineesToClaimBatches;
    expect(before).toEqual([
      [[100], [[A, B]]],
      [[100], [[B]]],
    ]);

    // The modal marks the batch claimed by its index; the list must not shrink under it.
    act(() => recordClaim(view.result.current, [[100], [[A, B]]]));
    view.rerender();
    expect(view.result.current.nomineesToClaimBatches).toEqual(before);

    // A new cursor read, even one that has not caught up yet, applies the recorded claim.
    mockCursorQuery(cursorReads(9, 8));
    view.rerender();
    expect(view.result.current.nomineesToClaimBatches).toEqual([[[100], [[B]]]]);
  });

  it('rebuilds after a claim confirmed late, even when the refresh read lags it', async () => {
    const reads = cursorReads(9, 9);
    mockBatchReads({ reads });
    const view = renderBatchesHook();
    // Confirmed by the receipt poll or another modal: recorded, but this list was built before.
    act(() => recordClaim(view.result.current, [[100], [[A]]]));
    // The RPC is a block behind, and the query keeps the same data reference.
    mockRefetch.mockResolvedValue({ data: reads });

    const refresh = await act(() => view.result.current.refetchClaimableBatches());

    expect(refresh.change).toBe('own-claims');
    expect(refresh.batches).toEqual([[[100], [[B]]]]);
    expect(view.result.current.nomineesToClaimBatches).toEqual([[[100], [[B]]]]);
  });

  it('does not show an epoch an own claim took when the cached read lags it', () => {
    mockBatchReads({ reads: cursorReads(8, 9) });
    const view = renderBatchesHook();
    act(() => recordClaim(view.result.current, [[100], [[A, B]]]));
    act(() => recordClaim(view.result.current, [[100], [[A]]]));
    // The cache refills from an RPC a block behind the second claim.
    mockCursorQuery(cursorReads(9, 10));

    view.rerender();

    expect(view.result.current.nomineesToClaimBatches).toEqual([]);
  });

  it('keeps a claim recorded in a closed modal out of the next one, on a lagging read', async () => {
    mockBatchReads({ reads: cursorReads(9, 9) });
    const closed = renderBatchesHook();
    act(() => recordClaim(closed.result.current, [[100], [[A]]]));
    closed.unmount();

    const reopened = renderBatchesHook();
    // The RPC has not caught up with the claim made in the closed modal.
    mockRefetch.mockResolvedValue({ data: cursorReads(9, 9) });
    const refresh = await act(() => reopened.result.current.refetchClaimableBatches());

    expect(reopened.result.current.nomineesToClaimBatches).toEqual([[[100], [[B]]]]);
    expect(refresh.batches).toEqual([[[100], [[B]]]]);
    expect(refresh.change).toBe('none');
  });

  it('gives the failed weight read as the cause when a refresh finds the weight missing', async () => {
    const result = renderBatches();
    const readError = new Error('execution reverted');
    jest.mocked(useNomineesWeights).mockReturnValue({
      data: { [A]: { percentage: 5 } },
      weightReadErrors: { [B]: readError },
      error: null,
    } as never);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { result: partial } = renderBatchesHook();
    mockRefetch.mockResolvedValue({ data: cursorReads(9, 9) });

    await expect(partial.current.refetchClaimableBatches()).rejects.toHaveProperty(
      'cause',
      readError,
    );
    expect(result.current.claimableBatchesError).toBeNull();
  });

  it('gives the failed weight read as the cause of the logged missing-weight error', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const readError = new Error('execution reverted');
    renderBatches();
    jest.mocked(useNomineesWeights).mockReturnValue({
      data: { [A]: { percentage: 5 } },
      weightReadErrors: { [B]: readError },
      error: null,
    } as never);

    renderBatchesHook();

    expect(spy).toHaveBeenCalledWith(
      'Could not read the claimable staking contracts',
      expect.objectContaining({ cause: readError }),
    );
  });

  it('exposes one nominee whose weight read failed instead of crashing', () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const result = renderBatches();
    jest.mocked(useNomineesWeights).mockReturnValue({
      data: { [A]: { percentage: 5 } },
      error: null,
    } as never);

    const { result: partial } = renderBatchesHook();

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
