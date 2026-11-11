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
import type { CursorChange } from 'common-util/functions/claim-batches';

import {
  PENDING_RECEIPT_POLL_MS,
  stillPendingMessage,
  useClaimStakingIncentivesBatch,
} from './useClaimStakingIncentivesBatch';

const ACCOUNT: Address = '0x00000000000000000000000000000000000000aa';
const OTHER_ACCOUNT: Address = '0x00000000000000000000000000000000000000bb';
const HASH = '0xhash';

const mockAccount: { current: Address | undefined } = { current: ACCOUNT };
jest.mock('wagmi', () => ({
  useAccount: () => ({ address: mockAccount.current }),
}));

const mockWriteContract = jest.fn();
const mockWaitForTransactionReceipt = jest.fn();
const mockGetTransactionReceipt = jest.fn();
jest.mock('@wagmi/core', () => ({
  writeContract: (...args: unknown[]) => mockWriteContract(...args),
  getPublicClient: (...args: unknown[]) => mockGetPublicClient(...args),
}));
const mockGetPublicClient = jest.fn();
const mockPublicClient = {
  waitForTransactionReceipt: (...args: unknown[]) => mockWaitForTransactionReceipt(...args),
  getTransactionReceipt: (...args: unknown[]) => mockGetTransactionReceipt(...args),
};
jest.mock('common-util/config/wagmi', () => ({ wagmiConfig: {} }));

class RevertError extends Error {}
const mockPrepareClaim = jest.fn();
jest.mock('common-util/functions/staking-incentives-claim', () => ({
  getUnclaimedReason: jest.requireActual('common-util/functions/staking-incentives-claim')
    .getUnclaimedReason,
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
  batch: forBatch,
  request: { args: forBatch, gas: BigInt(100) },
});

// One store per test, shared by every mount in it, as the app shares one across modal reopens.
let store = configureStore({ reducer: { govern: governReducer } });
const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>{children}</Provider>
);

const setup = (rebuiltBatches: ClaimBatch[] = [REBUILT], change: CursorChange = 'concurrent') => {
  const props = {
    onSuccess: jest.fn(),
    onError: jest.fn(),
    onLateReceipt: jest.fn(),
    onReceiptLookupFailed: jest.fn(),
    refetchClaimableBatches: jest.fn().mockResolvedValue({ batches: rebuiltBatches, change }),
    onBatchesRebuilt: jest.fn(),
    recordClaimedBatch: jest.fn(),
  };
  const { result, unmount, rerender } = renderHook(() => useClaimStakingIncentivesBatch(props), {
    wrapper,
  });
  const claim = () => act(() => result.current.claimIncentivesForBatch(FIRST));
  return { props, claim, result, unmount, rerender };
};

const pendingStatuses = () =>
  (store.getState().govern.pendingClaims[ACCOUNT] ?? []).map((entry) =>
    'hash' in entry ? `${entry.status} ${entry.hash}` : entry.status,
  );

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
    mockGetPublicClient.mockReturnValue(mockPublicClient);
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

    // The receipt is awaited on mainnet, whichever chain the wallet is on.
    expect(mockGetPublicClient).toHaveBeenCalledWith({}, { chainId: 1 });

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
    // The batch that was sent, not the one the claim started from.
    expect(props.recordClaimedBatch).toHaveBeenCalledWith(REBUILT);
  });

  it('reports a retry that fails with an error that is not a revert as is, without a second refresh', async () => {
    mockPrepareClaim
      .mockRejectedValueOnce(new RevertError('cursor moved'))
      .mockRejectedValueOnce(new Error('rpc down'));
    const { props, claim } = setup();

    await claim();

    expect(props.refetchClaimableBatches).toHaveBeenCalledTimes(1);
    expect(props.onError).toHaveBeenCalledWith({ kind: 'other', message: 'rpc down' });
    expect(mockWriteContract).not.toHaveBeenCalled();
  });

  it('reports the revert, not a failed refresh after it', async () => {
    mockPrepareClaim.mockRejectedValueOnce(new RevertError('Paused()'));
    const { props, claim } = setup();
    props.refetchClaimableBatches.mockRejectedValueOnce(new Error('rate limited'));

    await claim();

    expect(props.onError).toHaveBeenCalledWith({ kind: 'other', message: 'Paused()' });
    expect(console.error).toHaveBeenCalledWith(
      'Failed to refresh the claimable batches after a revert',
      expect.objectContaining({ message: 'rate limited' }),
    );
  });

  it('reports the retry revert, not a failed refresh after it', async () => {
    mockPrepareClaim
      .mockRejectedValueOnce(new RevertError('cursor moved'))
      .mockRejectedValueOnce(new RevertError('WrongAmount(1, 0)'));
    const { props, claim } = setup();
    props.refetchClaimableBatches
      .mockResolvedValueOnce({ batches: [REBUILT], change: 'concurrent' })
      .mockRejectedValueOnce(new Error('rate limited'));

    await claim();

    expect(props.refetchClaimableBatches).toHaveBeenCalledTimes(2);
    expect(props.onError).toHaveBeenCalledWith({ kind: 'other', message: 'WrongAmount(1, 0)' });
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
      .mockResolvedValueOnce({ batches: [REBUILT], change: 'concurrent' })
      .mockResolvedValueOnce({ batches: [], change: 'concurrent' });

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
    const { props, claim } = setup([FIRST], 'none');

    await claim();

    expect(mockPrepareClaim).toHaveBeenCalledTimes(1);
    expect(props.refetchClaimableBatches).toHaveBeenCalledTimes(1);
    expect(props.onBatchesRebuilt).not.toHaveBeenCalled();
    expect(props.onError).toHaveBeenCalledWith({ kind: 'other', message: 'Paused()' });
    expect(mockWriteContract).not.toHaveBeenCalled();
  });

  it('restarts the modal when only its own claims changed the list, without a retry', async () => {
    mockPrepareClaim.mockRejectedValue(new RevertError('Paused()'));
    const { props, claim } = setup();
    // An earlier own claim moved a cursor: no concurrent claim, but the shown list re-indexes.
    props.refetchClaimableBatches.mockResolvedValue({
      batches: [REBUILT],
      change: 'own-claims',
    });

    await claim();

    expect(props.onBatchesRebuilt).toHaveBeenCalledTimes(1);
    expect(mockPrepareClaim).toHaveBeenCalledTimes(1);
    expect(props.onError).toHaveBeenCalledWith({ kind: 'other', message: 'Paused()' });
  });

  it('restarts the modal after an on-chain failure that re-indexed the list', async () => {
    mockPrepareClaim.mockResolvedValue(prepared(FIRST));
    mockWaitForTransactionReceipt.mockResolvedValue({ status: 'reverted', transactionHash: HASH });
    const { props, claim } = setup();
    props.refetchClaimableBatches.mockResolvedValue({
      batches: [REBUILT],
      change: 'own-claims',
    });

    await claim();

    expect(props.onError).toHaveBeenCalledWith({ kind: 'reverted-after-simulation' });
    expect(props.onBatchesRebuilt).toHaveBeenCalledTimes(1);
  });

  it('reports the second revert as is when the cursors did not move again', async () => {
    mockPrepareClaim
      .mockRejectedValueOnce(new RevertError('cursor moved'))
      .mockRejectedValueOnce(new RevertError('WrongAmount(1, 0)'));
    const { props, claim } = setup();
    props.refetchClaimableBatches
      .mockResolvedValueOnce({ batches: [REBUILT], change: 'concurrent' })
      .mockResolvedValueOnce({ batches: [REBUILT], change: 'none' });

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
      kind: 'still-pending',
      hash: HASH,
      timedOut: true,
    });
    first.unmount();

    const reopened = setup();
    expect(reopened.result.current.isPending).toBe(true);
    await reopened.claim();
    expect(mockWriteContract).toHaveBeenCalledTimes(1);
    expect(reopened.props.onError).toHaveBeenCalledWith({
      kind: 'already-in-flight',
      message: expect.stringContaining(HASH),
    });
  });

  it('keeps the hash when the receipt wait fails', async () => {
    mockPrepareClaim.mockResolvedValue(prepared(FIRST));
    mockWaitForTransactionReceipt.mockRejectedValue(new Error('rpc down'));
    const { props, claim, result } = setup();

    await claim();

    expect(props.onError).toHaveBeenCalledWith({
      kind: 'still-pending',
      hash: HASH,
      timedOut: false,
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

  it('reports a missing mainnet client before the wallet opens, and leaves no pending claim', async () => {
    mockPrepareClaim.mockResolvedValue(prepared(FIRST));
    mockGetPublicClient.mockReturnValue(undefined);
    const { props, claim } = setup();

    await claim();

    expect(props.onError).toHaveBeenCalledWith({
      kind: 'other',
      message: 'No Ethereum mainnet client is configured',
    });
    expect(mockWriteContract).not.toHaveBeenCalled();
    expect(store.getState().govern.pendingClaims[ACCOUNT]).toBeUndefined();
  });

  it('refuses to claim without a connected wallet, before preparing anything', async () => {
    mockAccount.current = undefined;
    const { props, claim } = setup();

    await claim();

    expect(props.onError).toHaveBeenCalledWith({
      kind: 'other',
      message: 'Connect a wallet to claim',
    });
    expect(mockPrepareClaim).not.toHaveBeenCalled();
  });

  it('passes a refresh failure that is not `other` through as its own kind', async () => {
    mockPrepareClaim.mockResolvedValue(prepared(FIRST));
    mockWaitForTransactionReceipt.mockResolvedValue({ status: 'reverted', transactionHash: HASH });
    const { props, claim } = setup();
    props.refetchClaimableBatches.mockRejectedValue(new Error('rejected'));

    await claim();

    expect(props.onError).toHaveBeenNthCalledWith(2, { kind: 'wallet-rejected' });
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
      kind: 'refresh-failed',
      message: 'rate limited',
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
      // The first run will still reach the wallet, so its entry cannot be dismissed.
      expect(reopened.result.current.canDismissPendingClaim).toBe(false);
      await reopened.claim();
      expect(reopened.props.onError).toHaveBeenCalledWith({
        kind: 'already-in-flight',
        message: 'A claim is already being prepared. Finish it in your wallet first.',
      });
      expect(mockPrepareClaim).toHaveBeenCalledTimes(1);

      await act(async () => {
        finishPrepare(prepared(FIRST));
        await firstClaim;
      });
      expect(mockWriteContract).toHaveBeenCalledTimes(1);
    });

    it('lets a reopened modal dismiss a claim whose wallet never answered', async () => {
      mockPrepareClaim.mockResolvedValue(prepared(FIRST));
      // The wallet prompt was closed without an answer: no hash ever comes back.
      mockWriteContract.mockReturnValueOnce(new Promise(() => undefined));
      const first = setup();
      await act(async () => {
        first.result.current.claimIncentivesForBatch(FIRST);
      });
      // While this mount is still sending, the entry is not stale.
      expect(first.result.current.canDismissPendingClaim).toBe(false);
      first.unmount();

      const reopened = setup();
      expect(reopened.result.current.isPending).toBe(true);
      expect(reopened.result.current.canDismissPendingClaim).toBe(true);
      act(() => reopened.result.current.dismissPendingClaim());

      expect(reopened.result.current.isPending).toBe(false);
      await reopened.claim();
      expect(mockWriteContract).toHaveBeenCalledTimes(2);
    });

    it('keeps a newer claim guarded when a dismissed one fails later', async () => {
      mockPrepareClaim.mockResolvedValue(prepared(FIRST));
      let rejectFirstWallet: (error: Error) => void = () => undefined;
      mockWriteContract.mockReturnValueOnce(
        new Promise((_, reject) => {
          rejectFirstWallet = reject;
        }),
      );
      const first = setup();
      let firstClaim: Promise<void> = Promise.resolve();
      await act(async () => {
        firstClaim = first.result.current.claimIncentivesForBatch(FIRST);
      });
      first.unmount();
      const reopened = setup();
      act(() => reopened.result.current.dismissPendingClaim());
      // The newer claim is still being prepared when the dismissed wallet request fails.
      mockPrepareClaim.mockReturnValueOnce(new Promise(() => undefined));
      await act(async () => {
        reopened.result.current.claimIncentivesForBatch(FIRST);
      });

      await act(async () => {
        rejectFirstWallet(new Error('rejected'));
        await firstClaim;
      });

      expect(pendingStatuses()).toEqual(['preparing']);
      expect(reopened.result.current.isPending).toBe(true);
    });

    it('keeps a newer claim guarded when a dismissed one is signed and mined later', async () => {
      const OLD_HASH = '0xold';
      mockPrepareClaim.mockResolvedValue(prepared(FIRST));
      let signFirst: (hash: string) => void = () => undefined;
      mockWriteContract.mockReturnValueOnce(
        new Promise((resolve) => {
          signFirst = resolve;
        }),
      );
      // The dismissed claim mines at once; the newer one is still awaited.
      mockWaitForTransactionReceipt.mockImplementation(({ hash }: { hash: string }) =>
        hash === OLD_HASH ? Promise.resolve({ status: 'success' }) : new Promise(() => undefined),
      );
      const first = setup();
      let firstClaim: Promise<void> = Promise.resolve();
      await act(async () => {
        firstClaim = first.result.current.claimIncentivesForBatch(FIRST);
      });
      first.unmount();
      const reopened = setup();
      act(() => reopened.result.current.dismissPendingClaim());
      await act(async () => {
        reopened.result.current.claimIncentivesForBatch(FIRST);
      });
      expect(pendingStatuses()).toEqual([`waiting ${HASH}`]);

      await act(async () => {
        signFirst(OLD_HASH);
        await firstClaim;
      });

      expect(pendingStatuses()).toEqual([`waiting ${HASH}`]);
      expect(reopened.result.current.isPending).toBe(true);
    });

    it('guards the hash of a dismissed claim that is signed anyway', async () => {
      const OLD_HASH = '0xold';
      mockPrepareClaim.mockResolvedValue(prepared(FIRST));
      let signFirst: (hash: string) => void = () => undefined;
      mockWriteContract.mockReturnValueOnce(
        new Promise((resolve) => {
          signFirst = resolve;
        }),
      );
      mockWaitForTransactionReceipt.mockReturnValue(new Promise(() => undefined));
      const first = setup();
      await act(async () => {
        first.result.current.claimIncentivesForBatch(FIRST);
      });
      first.unmount();
      const reopened = setup();
      act(() => reopened.result.current.dismissPendingClaim());
      expect(reopened.result.current.isPending).toBe(false);

      await act(async () => {
        signFirst(OLD_HASH);
        await Promise.resolve();
      });

      expect(pendingStatuses()).toEqual([`waiting ${OLD_HASH}`]);
      expect(reopened.result.current.isPending).toBe(true);
    });

    it('guards a dismissed claim signed while a newer one holds the guard, after the newer settles', async () => {
      const OLD_HASH = '0xold';
      mockPrepareClaim.mockResolvedValue(prepared(FIRST));
      let signFirst: (hash: string) => void = () => undefined;
      mockWriteContract.mockReturnValueOnce(
        new Promise((resolve) => {
          signFirst = resolve;
        }),
      );
      let settleNewer: (receipt: unknown) => void = () => undefined;
      mockWaitForTransactionReceipt.mockImplementation(({ hash }: { hash: string }) =>
        hash === OLD_HASH
          ? new Promise(() => undefined)
          : new Promise((resolve) => {
              settleNewer = resolve;
            }),
      );
      const first = setup();
      await act(async () => {
        first.result.current.claimIncentivesForBatch(FIRST);
      });
      first.unmount();
      const reopened = setup();
      act(() => reopened.result.current.dismissPendingClaim());
      let newerClaim: Promise<void> = Promise.resolve();
      await act(async () => {
        newerClaim = reopened.result.current.claimIncentivesForBatch(FIRST);
      });

      await act(async () => {
        signFirst(OLD_HASH);
        await Promise.resolve();
      });
      expect(pendingStatuses()).toEqual([`waiting ${HASH}`, `waiting ${OLD_HASH}`]);

      await act(async () => {
        settleNewer({ status: 'success', transactionHash: HASH });
        await newerClaim;
      });
      expect(pendingStatuses()).toEqual([`waiting ${OLD_HASH}`]);
      expect(reopened.result.current.isPending).toBe(true);
      await reopened.claim();
      expect(reopened.props.onError).toHaveBeenCalledWith({
        kind: 'already-in-flight',
        message: stillPendingMessage(OLD_HASH),
      });
      expect(mockWriteContract).toHaveBeenCalledTimes(2);
    });

    it('refreshes a reopened modal when a claim an earlier modal sent confirms', async () => {
      mockPrepareClaim.mockResolvedValue(prepared(FIRST));
      const settle = settleLater();
      const first = setup();
      let firstClaim: Promise<void> = Promise.resolve();
      await act(async () => {
        firstClaim = first.result.current.claimIncentivesForBatch(FIRST);
      });
      first.unmount();
      const reopened = setup();
      expect(reopened.props.refetchClaimableBatches).not.toHaveBeenCalled();

      await act(async () => {
        settle({ status: 'success', transactionHash: HASH });
        await firstClaim;
      });

      expect(reopened.props.refetchClaimableBatches).toHaveBeenCalledTimes(1);
      expect(reopened.props.onBatchesRebuilt).toHaveBeenCalledTimes(1);
      expect(first.props.refetchClaimableBatches).not.toHaveBeenCalled();
    });

    it("does not refresh for the mount's own claim confirming", async () => {
      mockPrepareClaim.mockResolvedValue(prepared(FIRST));
      const { claim, props } = setup();

      await claim();

      expect(props.onSuccess).toHaveBeenCalledTimes(1);
      expect(props.refetchClaimableBatches).not.toHaveBeenCalled();
    });

    it('names the sent hash of a claim behind one still being prepared', async () => {
      const OLD_HASH = '0xold';
      mockPrepareClaim.mockResolvedValue(prepared(FIRST));
      let signFirst: (hash: string) => void = () => undefined;
      mockWriteContract.mockReturnValueOnce(
        new Promise((resolve) => {
          signFirst = resolve;
        }),
      );
      mockWaitForTransactionReceipt.mockReturnValue(new Promise(() => undefined));
      const first = setup();
      await act(async () => {
        first.result.current.claimIncentivesForBatch(FIRST);
      });
      first.unmount();
      const reopened = setup();
      act(() => reopened.result.current.dismissPendingClaim());
      mockPrepareClaim.mockReturnValueOnce(new Promise(() => undefined));
      await act(async () => {
        reopened.result.current.claimIncentivesForBatch(FIRST);
      });

      await act(async () => {
        signFirst(OLD_HASH);
        await Promise.resolve();
      });
      expect(pendingStatuses()).toEqual(['preparing', `waiting ${OLD_HASH}`]);

      expect(reopened.result.current.pendingHash).toBe(OLD_HASH);
      await reopened.claim();
      expect(reopened.props.onError).toHaveBeenCalledWith({
        kind: 'already-in-flight',
        message: stillPendingMessage(OLD_HASH),
      });
    });

    it('reports isPreparing only while the claim is being prepared', async () => {
      let finishPrepare: (value: unknown) => void = () => undefined;
      mockPrepareClaim.mockReturnValueOnce(
        new Promise((resolve) => {
          finishPrepare = resolve;
        }),
      );
      const { result } = setup();
      let claiming: Promise<void> = Promise.resolve();
      await act(async () => {
        claiming = result.current.claimIncentivesForBatch(FIRST);
      });
      expect(result.current.isPreparing).toBe(true);

      await act(async () => {
        finishPrepare(prepared(FIRST));
        await claiming;
      });
      expect(result.current.isPreparing).toBe(false);
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
        kind: 'already-in-flight',
        message: 'A claim is already being prepared. Finish it in your wallet first.',
      });
    });

    it.each<[string, () => void, ClaimBatch[]]>([
      [
        'the prepare fails',
        () => mockPrepareClaim.mockRejectedValueOnce(new Error('rpc down')),
        [REBUILT],
      ],
      [
        'the wallet rejects',
        () => {
          mockPrepareClaim.mockResolvedValue(prepared(FIRST));
          mockWriteContract.mockRejectedValueOnce(new Error('rejected'));
        },
        [REBUILT],
      ],
      [
        'claims changed twice',
        () =>
          mockPrepareClaim
            .mockRejectedValueOnce(new RevertError('cursor moved'))
            .mockRejectedValueOnce(new RevertError('cursor moved again')),
        [REBUILT],
      ],
      [
        'nothing is left to claim',
        () => mockPrepareClaim.mockRejectedValueOnce(new RevertError('cursor moved')),
        [],
      ],
    ])('is cleared when %s, so the next claim can send', async (_, fail, rebuiltBatches) => {
      fail();
      const { claim, props, result } = setup(rebuiltBatches);
      await claim();
      expect(result.current.isPending).toBe(false);
      const sendsBefore = mockWriteContract.mock.calls.length;

      mockPrepareClaim.mockResolvedValue(prepared(FIRST));
      mockWriteContract.mockResolvedValue(HASH);
      await claim();
      expect(mockWriteContract).toHaveBeenCalledTimes(sendsBefore + 1);
      expect(mockWriteContract).toHaveBeenLastCalledWith({}, { args: FIRST, gas: BigInt(100) });
      expect(props.onError).not.toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'already-in-flight' }),
      );
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
      // It may still mine, so it cannot be dismissed.
      expect(reopened.result.current.canDismissPendingClaim).toBe(false);
      act(() => reopened.result.current.dismissPendingClaim());
      expect(pendingStatuses()).toEqual([`waiting ${HASH}`]);
    });

    describe('after the wait timed out', () => {
      beforeEach(() => jest.useFakeTimers());
      afterEach(() => jest.useRealTimers());

      const timedOutClaim = async () => {
        mockPrepareClaim.mockResolvedValue(prepared(FIRST));
        timeOut();
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

      it('looks the receipt up on mainnet', async () => {
        const { unmount } = await timedOutClaim();
        unmount();
        mockGetPublicClient.mockClear();

        setup();
        await poll();

        expect(mockGetPublicClient).toHaveBeenCalledWith({}, { chainId: 1 });
        expect(mockGetTransactionReceipt).toHaveBeenCalled();
      });

      it('logs and skips the lookup when there is no mainnet client', async () => {
        const { unmount } = await timedOutClaim();
        unmount();
        mockGetPublicClient.mockReturnValue(undefined);
        mockGetTransactionReceipt.mockClear();

        setup();
        await poll();

        expect(mockGetTransactionReceipt).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith(
          `No Ethereum mainnet client to check claim transaction ${HASH}`,
        );
      });

      it('reports a late receipt once when two lookups overlap', async () => {
        const { props } = await timedOutClaim();
        const lookups: ((receipt: unknown) => void)[] = [];
        mockGetTransactionReceipt.mockImplementation(
          () =>
            new Promise((resolve) => {
              lookups.push(resolve);
            }),
        );
        await poll();
        await poll();
        expect(lookups.length).toBeGreaterThanOrEqual(2);

        await act(async () => {
          lookups.forEach((resolve) => resolve({ status: 'success', transactionHash: HASH }));
        });

        expect(props.onLateReceipt).toHaveBeenCalledTimes(1);
        expect(props.refetchClaimableBatches).toHaveBeenCalledTimes(1);
      });

      it('reports nothing for a lookup that resolves after the claim was dismissed', async () => {
        const { props, result } = await timedOutClaim();
        let resolveLookup: (receipt: unknown) => void = () => undefined;
        mockGetTransactionReceipt.mockReturnValue(
          new Promise((resolve) => {
            resolveLookup = resolve;
          }),
        );
        await poll();

        act(() => result.current.dismissPendingClaim());
        await act(async () => resolveLookup({ status: 'success', transactionHash: HASH }));

        expect(props.onLateReceipt).not.toHaveBeenCalled();
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

      it('tells the user once that the lookup is failing, and keeps polling', async () => {
        const { props, result } = await timedOutClaim();
        props.onError.mockClear();
        mockGetTransactionReceipt.mockRejectedValue(new Error('rpc down'));

        await poll();
        await poll();

        expect(props.onReceiptLookupFailed).toHaveBeenCalledTimes(1);
        expect(props.onReceiptLookupFailed).toHaveBeenCalledWith({ hash: HASH });
        // Not a claim failure: the transaction may still mine.
        expect(props.onError).not.toHaveBeenCalled();
        mockGetTransactionReceipt.mockResolvedValue({ status: 'success', transactionHash: HASH });
        await poll();
        expect(props.onLateReceipt).toHaveBeenCalledWith({ hash: HASH, claimed: true });
        expect(result.current.pendingHash).toBeUndefined();
      });

      it('polls every unconfirmed claim, not only the first', async () => {
        const OLD_HASH = '0xold';
        mockPrepareClaim.mockResolvedValue(prepared(FIRST));
        let signFirst: (hash: string) => void = () => undefined;
        mockWriteContract.mockReturnValueOnce(
          new Promise((resolve) => {
            signFirst = resolve;
          }),
        );
        timeOut();
        const first = setup();
        await act(async () => {
          first.result.current.claimIncentivesForBatch(FIRST);
        });
        first.unmount();
        const reopened = setup();
        act(() => reopened.result.current.dismissPendingClaim());
        await reopened.claim();
        await act(async () => {
          signFirst(OLD_HASH);
        });
        expect(pendingStatuses()).toEqual([`unconfirmed ${HASH}`, `unconfirmed ${OLD_HASH}`]);

        // Only the dismissed claim, second in the list, has mined.
        mockGetTransactionReceipt.mockImplementation(({ hash }: { hash: string }) =>
          hash === OLD_HASH
            ? Promise.resolve({ status: 'success', transactionHash: OLD_HASH })
            : Promise.reject(new TransactionReceiptNotFoundError({ hash: HASH })),
        );
        await poll();

        expect(reopened.props.onLateReceipt).toHaveBeenCalledWith({
          hash: OLD_HASH,
          claimed: true,
        });
        expect(pendingStatuses()).toEqual([`unconfirmed ${HASH}`]);
      });

      it('can be dismissed, for a hash the wallet replaced', async () => {
        const { result } = await timedOutClaim();
        expect(result.current.canDismissPendingClaim).toBe(true);

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
