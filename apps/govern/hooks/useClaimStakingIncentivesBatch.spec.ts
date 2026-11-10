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

const setup = (rebuiltBatches: ClaimBatch[] = [REBUILT]) => {
  const props = {
    onSuccess: jest.fn(),
    onError: jest.fn(),
    refetchClaimableBatches: jest.fn().mockResolvedValue(rebuiltBatches),
    onBatchesRebuilt: jest.fn(),
  };
  const { result } = renderHook(() => useClaimStakingIncentivesBatch(props));
  const claim = () => act(() => result.current.claimIncentivesForBatch(FIRST));
  return { props, claim };
};

describe('useClaimStakingIncentivesBatch', () => {
  beforeEach(() => {
    jest.resetAllMocks();
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
