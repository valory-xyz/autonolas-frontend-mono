import { act, renderHook } from '@testing-library/react';
import type { Address } from 'viem';

import type { ClaimBatch } from 'common-util/functions/staking-incentives-claim';

import { useClaimStakingIncentivesBatch } from './useClaimStakingIncentivesBatch';

const ACCOUNT: Address = '0x00000000000000000000000000000000000000aa';
const HASH = '0xhash';

jest.mock('wagmi', () => ({
  useAccount: () => ({ address: ACCOUNT }),
}));

const mockWriteContract = jest.fn();
const mockWaitForTransactionReceipt = jest.fn();
jest.mock('@wagmi/core', () => ({
  writeContract: (...args: unknown[]) => mockWriteContract(...args),
  getPublicClient: () => ({
    waitForTransactionReceipt: (...args: unknown[]) => mockWaitForTransactionReceipt(...args),
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
  params: { args: forBatch },
  request: { args: forBatch },
});

const setup = (rebuiltBatches: ClaimBatch[] = [REBUILT], cursorsChanged = true) => {
  const props = {
    onSuccess: jest.fn(),
    onError: jest.fn(),
    refetchClaimableBatches: jest
      .fn()
      .mockResolvedValue({ batches: rebuiltBatches, cursorsChanged }),
    onBatchesRebuilt: jest.fn(),
  };
  const { result } = renderHook(() => useClaimStakingIncentivesBatch(props));
  const claim = () => act(() => result.current.claimIncentivesForBatch(FIRST));
  return { props, claim };
};

describe('useClaimStakingIncentivesBatch', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockWriteContract.mockResolvedValue(HASH);
    mockWaitForTransactionReceipt.mockResolvedValue({ status: 'success' });
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

  it('waits for the receipt without a timeout', async () => {
    mockPrepareClaim.mockResolvedValue(prepared(FIRST));
    const { claim } = setup();

    await claim();

    expect(mockWaitForTransactionReceipt).toHaveBeenCalledWith(
      expect.objectContaining({ hash: HASH, timeout: 0, onReplaced: expect.any(Function) }),
    );
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

    expect(props.onError).toHaveBeenCalledTimes(1);
    expect(props.onError).toHaveBeenCalledWith({ kind: 'reverted-after-simulation' });
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
    expect(props.onSuccess).not.toHaveBeenCalled();
  });
});
