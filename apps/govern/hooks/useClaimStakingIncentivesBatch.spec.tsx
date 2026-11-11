import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react';
import {
  type Address,
  TransactionReceiptNotFoundError,
  WaitForTransactionReceiptTimeoutError,
} from 'viem';

import { governReducer } from 'store/govern';
import type { ClaimBatch } from 'common-util/functions/staking-incentives-claim';

import {
  PENDING_RECEIPT_POLL_MS,
  useClaimStakingIncentivesBatch,
} from './useClaimStakingIncentivesBatch';

const ACCOUNT: Address = '0x00000000000000000000000000000000000000aa';
const OTHER_ACCOUNT: Address = '0x00000000000000000000000000000000000000bb';
const HASH = '0xhash';

const mockAccount = { current: ACCOUNT };
jest.mock('wagmi', () => ({
  useAccount: () => ({ address: mockAccount.current }),
}));

const mockWriteContract = jest.fn();
const mockWaitForTransactionReceipt = jest.fn();
const mockGetTransactionReceipt = jest.fn();
jest.mock('@wagmi/core', () => ({
  writeContract: (...args: unknown[]) => mockWriteContract(...args),
  getPublicClient: () => ({
    waitForTransactionReceipt: (...args: unknown[]) => mockWaitForTransactionReceipt(...args),
    getTransactionReceipt: (...args: unknown[]) => mockGetTransactionReceipt(...args),
  }),
}));
jest.mock('common-util/config/wagmi', () => ({ wagmiConfig: {} }));
jest.mock('libs/util-functions/src/lib/estimateGasWithBuffer', () => ({
  estimateGasWithBuffer: () => Promise.resolve(BigInt(100)),
}));

class RevertError extends Error {}
const mockPrepareClaim = jest.fn();
jest.mock('common-util/functions/staking-incentives-claim', () => ({
  prepareClaim: (...args: unknown[]) => mockPrepareClaim(...args),
  isContractRevert: (error: unknown) => error instanceof RevertError,
  toClaimError: (error: Error) =>
    error.message === 'rejected'
      ? { kind: 'wallet-rejected' }
      : { kind: 'other', message: error.message },
}));

const batch = (target: Address): ClaimBatch => [[100], [[target]]];
const FIRST = batch('0x0000000000000000000000000000000000000001');
const REBUILT = batch('0x0000000000000000000000000000000000000002');
const prepared = (forBatch: ClaimBatch) => ({
  quotes: forBatch[0].map((chainId, i) => ({ chainId, targets: forBatch[1][i] })),
  params: { args: forBatch },
  request: { args: forBatch },
});

// One store per test, shared by every mount in it, as the app shares one across modal reopens.
let store = configureStore({ reducer: { govern: governReducer } });
const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>{children}</Provider>
);

const setup = (rebuiltBatches: ClaimBatch[] = [REBUILT], cursorsChanged = true) => {
  const props = {
    onSuccess: jest.fn(),
    onError: jest.fn(),
    onLateReceipt: jest.fn(),
    refetchClaimableBatches: jest
      .fn()
      .mockResolvedValue({ batches: rebuiltBatches, cursorsChanged }),
    onBatchesRebuilt: jest.fn(),
    recordClaimedBatch: jest.fn(),
  };
  const { result, unmount, rerender } = renderHook(() => useClaimStakingIncentivesBatch(props), {
    wrapper,
  });
  const claim = () => act(() => result.current.claimIncentivesForBatch(FIRST));
  return { props, claim, result, unmount, rerender };
};

const settleLater = () => {
  let settle: (value: unknown) => void = () => undefined;
  mockWaitForTransactionReceipt.mockReturnValue(
    new Promise((resolve) => {
      settle = resolve;
    }),
  );
  return (value: unknown) => settle(value);
};

describe('useClaimStakingIncentivesBatch', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    store = configureStore({ reducer: { govern: governReducer } });
    mockAccount.current = ACCOUNT;
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockWriteContract.mockResolvedValue(HASH);
    mockWaitForTransactionReceipt.mockResolvedValue({ status: 'success' });
    mockGetTransactionReceipt.mockRejectedValue(
      new TransactionReceiptNotFoundError({ hash: HASH }),
    );
  });

  it('sends the simulated request once and reports success', async () => {
    mockPrepareClaim.mockResolvedValue(prepared(FIRST));
    const { props, claim } = setup();

    await claim();

    expect(mockPrepareClaim).toHaveBeenCalledWith(FIRST, ACCOUNT);
    expect(mockWriteContract).toHaveBeenCalledWith({}, { args: FIRST, gas: BigInt(100) });
    expect(props.onSuccess).toHaveBeenCalledTimes(1);
    expect(props.refetchClaimableBatches).not.toHaveBeenCalled();
  });

  it('rebuilds from fresh cursors after a concurrent claim and sends the rebuilt batch', async () => {
    mockPrepareClaim
      .mockRejectedValueOnce(new RevertError('cursor moved'))
      .mockResolvedValueOnce(prepared(REBUILT));
    const { props, claim } = setup();

    await claim();

    expect(props.refetchClaimableBatches).toHaveBeenCalledTimes(1);
    expect(props.onBatchesRebuilt).toHaveBeenCalledTimes(1);
    expect(mockPrepareClaim).toHaveBeenLastCalledWith(REBUILT, ACCOUNT);
    expect(mockWriteContract).toHaveBeenCalledWith({}, { args: REBUILT, gas: BigInt(100) });
    expect(props.onSuccess).toHaveBeenCalledTimes(1);
  });

  it('reports nothing to claim when the rebuild leaves no batch', async () => {
    mockPrepareClaim.mockRejectedValueOnce(new RevertError('cursor moved'));
    const { props, claim } = setup([]);

    await claim();

    expect(props.onError).toHaveBeenCalledWith({ kind: 'nothing-to-claim' });
    expect(mockWriteContract).not.toHaveBeenCalled();
  });

  it('reports nothing to claim when the second refresh leaves no batch', async () => {
    mockPrepareClaim.mockRejectedValue(new RevertError('cursor moved'));
    const { props, claim } = setup();
    props.refetchClaimableBatches
      .mockResolvedValueOnce({ batches: [REBUILT], cursorsChanged: true })
      .mockResolvedValueOnce({ batches: [], cursorsChanged: true });

    await claim();

    expect(props.onError).toHaveBeenCalledWith({ kind: 'nothing-to-claim' });
    expect(mockWriteContract).not.toHaveBeenCalled();
  });

  it('rebuilds only once, then refreshes and reports that claims changed', async () => {
    mockPrepareClaim.mockRejectedValue(new RevertError('cursor moved'));
    const { props, claim } = setup();

    await claim();

    expect(mockPrepareClaim).toHaveBeenCalledTimes(2);
    expect(props.refetchClaimableBatches).toHaveBeenCalledTimes(2);
    expect(props.onError).toHaveBeenCalledWith({ kind: 'claims-changed' });
    expect(mockWriteContract).not.toHaveBeenCalled();
  });

  it('does not rebuild on an error that is not a revert', async () => {
    mockPrepareClaim.mockRejectedValue(new Error('rpc down'));
    const { props, claim } = setup();

    await claim();

    expect(props.refetchClaimableBatches).not.toHaveBeenCalled();
    expect(props.onError).toHaveBeenCalledWith({ kind: 'other', message: 'rpc down' });
  });

  it('keeps a wallet rejection separate and does not rebuild', async () => {
    mockPrepareClaim.mockResolvedValue(prepared(FIRST));
    mockWriteContract.mockRejectedValue(new Error('rejected'));
    const { props, claim } = setup();

    await claim();

    expect(props.onError).toHaveBeenCalledWith({ kind: 'wallet-rejected' });
    expect(props.refetchClaimableBatches).not.toHaveBeenCalled();
  });

  it('reports a revert with unchanged cursors as is, without a rebuild or a retry', async () => {
    mockPrepareClaim.mockRejectedValue(new RevertError('Paused()'));
    const { props, claim } = setup([FIRST], false);

    await claim();

    expect(mockPrepareClaim).toHaveBeenCalledTimes(1);
    expect(props.refetchClaimableBatches).toHaveBeenCalledTimes(1);
    expect(props.onBatchesRebuilt).not.toHaveBeenCalled();
    expect(props.onError).toHaveBeenCalledWith({ kind: 'other', message: 'Paused()' });
    expect(mockWriteContract).not.toHaveBeenCalled();
  });

  it('reports the second revert as is when the cursors did not move again', async () => {
    mockPrepareClaim
      .mockRejectedValueOnce(new RevertError('cursor moved'))
      .mockRejectedValueOnce(new RevertError('WrongAmount(1, 0)'));
    const { props, claim } = setup();
    props.refetchClaimableBatches
      .mockResolvedValueOnce({ batches: [REBUILT], cursorsChanged: true })
      .mockResolvedValueOnce({ batches: [REBUILT], cursorsChanged: false });

    await claim();

    expect(props.onBatchesRebuilt).toHaveBeenCalledTimes(1);
    expect(props.onError).toHaveBeenCalledWith({ kind: 'other', message: 'WrongAmount(1, 0)' });
  });

  it('logs the original error before reporting it', async () => {
    const error = new Error('rpc down');
    mockPrepareClaim.mockRejectedValue(error);
    const { claim } = setup();

    await claim();

    expect(console.error).toHaveBeenCalledWith('Failed to claim staking incentives', error);
  });

  it('waits for the receipt for a bounded time and records the claimed batch', async () => {
    mockPrepareClaim.mockResolvedValue(prepared(FIRST));
    const { props, claim } = setup();

    await claim();

    expect(mockWaitForTransactionReceipt).toHaveBeenCalledWith(
      expect.objectContaining({
        hash: HASH,
        timeout: 20 * 60 * 1000,
        onReplaced: expect.any(Function),
      }),
    );
    expect(props.recordClaimedBatch).toHaveBeenCalledWith(FIRST);
  });

  it('stays pending while the receipt is awaited, and clears once it settles', async () => {
    mockPrepareClaim.mockResolvedValue(prepared(FIRST));
    const settle = settleLater();
    const { result } = setup();

    let claiming: Promise<void> = Promise.resolve();
    await act(async () => {
      claiming = result.current.claimIncentivesForBatch(FIRST);
    });
    expect(result.current.isPending).toBe(true);
    expect(result.current.pendingHash).toBe(HASH);

    await act(async () => {
      settle({ status: 'success', transactionHash: HASH });
      await claiming;
    });
    expect(result.current.isPending).toBe(false);
    expect(result.current.pendingHash).toBeUndefined();
  });

  it('keeps a timed-out claim pending, across a remount, and refuses to send another', async () => {
    mockPrepareClaim.mockResolvedValue(prepared(FIRST));
    mockWaitForTransactionReceipt.mockRejectedValue(
      new WaitForTransactionReceiptTimeoutError({ hash: HASH }),
    );
    const first = setup();

    await first.claim();

    expect(first.props.onError).toHaveBeenCalledWith({
      kind: 'other',
      message: `Transaction ${HASH} is still pending. Check your wallet before claiming again.`,
    });
    first.unmount();

    const reopened = setup();
    expect(reopened.result.current.isPending).toBe(true);
    await reopened.claim();
    expect(mockWriteContract).toHaveBeenCalledTimes(1);
    expect(reopened.props.onError).toHaveBeenCalledWith({
      kind: 'other',
      message: expect.stringContaining(HASH),
    });
  });

  it('keeps the hash when the receipt wait fails', async () => {
    mockPrepareClaim.mockResolvedValue(prepared(FIRST));
    mockWaitForTransactionReceipt.mockRejectedValue(new Error('rpc down'));
    const { props, claim, result } = setup();

    await claim();

    expect(props.onError).toHaveBeenCalledWith({
      kind: 'other',
      message: `Could not confirm transaction ${HASH}. Check your wallet before claiming again.`,
    });
    expect(result.current.pendingHash).toBe(HASH);
    expect(props.onSuccess).not.toHaveBeenCalled();
  });

  it.each([
    ['cancelled', { kind: 'wallet-rejected' }],
    ['replaced', { kind: 'reverted-after-simulation' }],
  ])(
    'does not report a claim when the transaction was %s in the wallet',
    async (reason, expected) => {
      mockPrepareClaim.mockResolvedValue(prepared(FIRST));
      mockWaitForTransactionReceipt.mockImplementation(
        async ({ onReplaced }: { onReplaced: (r: { reason: string }) => void }) => {
          onReplaced({ reason });
          return { status: 'success', transactionHash: '0xother' };
        },
      );
      const { props, claim } = setup();

      await claim();

      expect(props.onSuccess).not.toHaveBeenCalled();
      expect(props.onError).toHaveBeenCalledWith(expected);
      expect(mockWriteContract).toHaveBeenCalledTimes(1);
      expect(props.onError.mock.invocationCallOrder[0]).toBeLessThan(
        props.refetchClaimableBatches.mock.invocationCallOrder[0],
      );
    },
  );

  it('reports a repriced transaction that succeeded as claimed', async () => {
    mockPrepareClaim.mockResolvedValue(prepared(FIRST));
    mockWaitForTransactionReceipt.mockImplementation(
      async ({ onReplaced }: { onReplaced: (r: { reason: string }) => void }) => {
        onReplaced({ reason: 'repriced' });
        return { status: 'success', transactionHash: '0xrepriced' };
      },
    );
    const { props, claim } = setup();

    await claim();

    expect(props.onSuccess).toHaveBeenCalledTimes(1);
    expect(props.onError).not.toHaveBeenCalled();
  });

  it('still reports the on-chain failure when the refresh after it fails', async () => {
    mockPrepareClaim.mockResolvedValue(prepared(FIRST));
    mockWaitForTransactionReceipt.mockResolvedValue({ status: 'reverted', transactionHash: HASH });
    const { props, claim } = setup();
    props.refetchClaimableBatches.mockRejectedValue(new Error('rate limited'));

    await claim();

    expect(props.onError).toHaveBeenCalledTimes(2);
    expect(props.onError).toHaveBeenNthCalledWith(1, { kind: 'reverted-after-simulation' });
    expect(props.onError).toHaveBeenNthCalledWith(2, {
      kind: 'other',
      message: 'Could not refresh the claim list: rate limited',
    });
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining(HASH));
  });

  it('refreshes after a revert that follows a successful simulation, without resending', async () => {
    mockPrepareClaim.mockResolvedValue(prepared(FIRST));
    mockWaitForTransactionReceipt.mockResolvedValue({ status: 'reverted' });
    const { props, claim } = setup();

    await claim();

    expect(mockWriteContract).toHaveBeenCalledTimes(1);
    expect(props.refetchClaimableBatches).toHaveBeenCalledTimes(1);
    expect(props.onError).toHaveBeenCalledWith({ kind: 'reverted-after-simulation' });
    expect(props.onError.mock.invocationCallOrder[0]).toBeLessThan(
      props.refetchClaimableBatches.mock.invocationCallOrder[0],
    );
    expect(props.onSuccess).not.toHaveBeenCalled();
    expect(props.recordClaimedBatch).not.toHaveBeenCalled();
  });

  describe('the pending claim', () => {
    const timeOut = () =>
      mockWaitForTransactionReceipt.mockRejectedValue(
        new WaitForTransactionReceiptTimeoutError({ hash: HASH }),
      );
    const notMinedYet = () =>
      mockGetTransactionReceipt.mockRejectedValue(
        new TransactionReceiptNotFoundError({ hash: HASH }),
      );

    it('refuses a claim from a reopened modal while the first is still being prepared', async () => {
      let finishPrepare: (value: unknown) => void = () => undefined;
      mockPrepareClaim.mockReturnValueOnce(
        new Promise((resolve) => {
          finishPrepare = resolve;
        }),
      );
      const first = setup();
      let firstClaim: Promise<void> = Promise.resolve();
      await act(async () => {
        firstClaim = first.result.current.claimIncentivesForBatch(FIRST);
      });
      first.unmount();

      const reopened = setup();
      expect(reopened.result.current.isPending).toBe(true);
      await reopened.claim();
      expect(reopened.props.onError).toHaveBeenCalledWith({
        kind: 'other',
        message: 'A claim is already being prepared. Finish it in your wallet first.',
      });
      expect(mockPrepareClaim).toHaveBeenCalledTimes(1);

      await act(async () => {
        finishPrepare(prepared(FIRST));
        await firstClaim;
      });
      expect(mockWriteContract).toHaveBeenCalledTimes(1);
    });

    it('refuses a second click before the first has re-rendered', async () => {
      mockPrepareClaim.mockResolvedValue(prepared(FIRST));
      const { props, result } = setup();

      await act(async () => {
        const { claimIncentivesForBatch } = result.current;
        await Promise.all([claimIncentivesForBatch(FIRST), claimIncentivesForBatch(FIRST)]);
      });

      expect(mockPrepareClaim).toHaveBeenCalledTimes(1);
      expect(mockWriteContract).toHaveBeenCalledTimes(1);
      expect(props.onError).toHaveBeenCalledWith({
        kind: 'other',
        message: 'A claim is already being prepared. Finish it in your wallet first.',
      });
    });

    it.each([
      ['the prepare fails', () => mockPrepareClaim.mockRejectedValueOnce(new Error('rpc down'))],
      [
        'the wallet rejects',
        () => {
          mockPrepareClaim.mockResolvedValue(prepared(FIRST));
          mockWriteContract.mockRejectedValueOnce(new Error('rejected'));
        },
      ],
    ])('is cleared when %s, so the next claim can send', async (_, fail) => {
      fail();
      const { claim, result } = setup();
      await claim();
      expect(result.current.isPending).toBe(false);

      mockPrepareClaim.mockResolvedValue(prepared(FIRST));
      mockWriteContract.mockResolvedValue(HASH);
      await claim();
      expect(mockWriteContract).toHaveBeenLastCalledWith({}, { args: FIRST, gas: BigInt(100) });
    });

    it.each([
      ['reverted', { status: 'reverted', transactionHash: HASH }, undefined],
      ['cancelled', { status: 'success', transactionHash: '0xother' }, 'cancelled'],
      ['replaced', { status: 'success', transactionHash: '0xother' }, 'replaced'],
    ])(
      'is cleared after a %s receipt, so a new claim can be signed',
      async (_, receipt, reason) => {
        mockPrepareClaim.mockResolvedValue(prepared(FIRST));
        mockWaitForTransactionReceipt.mockImplementationOnce(
          async ({ onReplaced }: { onReplaced: (r: { reason: string }) => void }) => {
            if (reason) onReplaced({ reason });
            return receipt;
          },
        );
        const { claim, result } = setup();

        await claim();
        expect(result.current.pendingHash).toBeUndefined();
        expect(result.current.isPending).toBe(false);

        await claim();
        expect(mockWriteContract).toHaveBeenCalledTimes(2);
      },
    );

    it('is kept per account', async () => {
      mockPrepareClaim.mockResolvedValue(prepared(FIRST));
      timeOut();
      notMinedYet();
      const { claim, result, rerender } = setup();
      await claim();
      expect(result.current.pendingHash).toBe(HASH);

      mockAccount.current = OTHER_ACCOUNT;
      rerender();
      expect(result.current.isPending).toBe(false);
      mockWaitForTransactionReceipt.mockResolvedValue({ status: 'success' });
      await claim();
      expect(mockWriteContract).toHaveBeenCalledTimes(2);

      mockAccount.current = ACCOUNT;
      mockGetTransactionReceipt.mockResolvedValue({ status: 'success', transactionHash: HASH });
      rerender();
      await act(async () => undefined);
      expect(result.current.pendingHash).toBeUndefined();
    });

    it('is not looked up while its receipt is still awaited', async () => {
      mockPrepareClaim.mockResolvedValue(prepared(FIRST));
      settleLater();
      const first = setup();
      await act(async () => {
        first.result.current.claimIncentivesForBatch(FIRST);
      });
      first.unmount();

      const reopened = setup();
      await act(async () => undefined);

      expect(reopened.result.current.pendingHash).toBe(HASH);
      expect(mockGetTransactionReceipt).not.toHaveBeenCalled();
    });

    describe('after the wait timed out', () => {
      beforeEach(() => jest.useFakeTimers());
      afterEach(() => jest.useRealTimers());

      const timedOutClaim = async () => {
        mockPrepareClaim.mockResolvedValue(prepared(FIRST));
        timeOut();
        notMinedYet();
        const view = setup();
        await view.claim();
        return view;
      };
      const poll = () => act(async () => jest.advanceTimersByTime(PENDING_RECEIPT_POLL_MS));

      it.each([
        ['success', true],
        ['reverted', false],
      ])('keeps looking for the receipt and reports a late %s receipt', async (status, claimed) => {
        const { props, result } = await timedOutClaim();
        await poll();
        expect(result.current.pendingHash).toBe(HASH);
        expect(props.onLateReceipt).not.toHaveBeenCalled();

        mockGetTransactionReceipt.mockResolvedValue({ status, transactionHash: HASH });
        await poll();

        expect(props.onLateReceipt).toHaveBeenCalledWith({ hash: HASH, claimed });
        expect(props.refetchClaimableBatches).toHaveBeenCalledTimes(1);
        expect(result.current.pendingHash).toBeUndefined();
        expect(result.current.isPending).toBe(false);
      });

      it('logs a failed lookup, but not a receipt that does not exist yet', async () => {
        await timedOutClaim();
        jest.mocked(console.error).mockClear();

        await poll();
        expect(console.error).not.toHaveBeenCalled();

        mockGetTransactionReceipt.mockRejectedValue(new Error('rpc down'));
        await poll();
        expect(console.error).toHaveBeenCalledWith(
          `Could not check claim transaction ${HASH}`,
          expect.any(Error),
        );
      });

      it('can be dismissed, for a hash the wallet replaced', async () => {
        const { result } = await timedOutClaim();
        expect(result.current.isPendingUnconfirmed).toBe(true);

        act(() => result.current.dismissPendingClaim());

        expect(result.current.pendingHash).toBeUndefined();
        expect(result.current.isPending).toBe(false);
        mockGetTransactionReceipt.mockClear();
        await poll();
        expect(mockGetTransactionReceipt).not.toHaveBeenCalled();
      });
    });
  });
});
