import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import type { Address } from 'viem';

import { notifyError, notifySuccess, notifyWarning } from 'libs/util-functions/src';
import type { ClaimBatch } from 'common-util/functions/staking-incentives-claim';
import {
  type ClaimNotice,
  useClaimStakingIncentivesBatch,
} from 'hooks/useClaimStakingIncentivesBatch';

import { ClaimStakingIncentivesModal, STEP_CHANGE_DELAY } from './ClaimStakingIncentivesModal';

jest.mock('libs/util-functions/src', () => ({
  formatWeiNumber: () => '0',
  notifyError: jest.fn(),
  notifySuccess: jest.fn(),
  notifyWarning: jest.fn(),
}));
jest.mock('store/index', () => ({
  useAppSelector: (selector: (state: unknown) => unknown) =>
    selector({ govern: { stakingContracts: [] } }),
}));

const batch = (n: number): ClaimBatch => [[100], [[`0x${n}` as Address]]];
const BATCHES = [batch(1), batch(2), batch(3)];
const mockBatches = { current: BATCHES };
const mockLoadError: { current: string | null } = { current: null };
jest.mock('hooks/useClaimableNomineeBatches', () => ({
  useClaimableNomineesBatches: () => ({
    nomineesToClaimBatches: mockBatches.current,
    claimableBatchesError: mockLoadError.current,
    recordClaimedBatch: jest.fn(),
    isLoadingClaimableBatches: false,
    clearClaimableBatches: jest.fn(),
    refetchClaimableBatches: jest.fn(),
  }),
}));
jest.mock('hooks/useClaimStakingIncentivesBatch', () => ({
  stillPendingMessage: (hash: string) => `pending: ${hash}`,
  useClaimStakingIncentivesBatch: jest.fn(),
}));

type ClaimProps = Parameters<typeof useClaimStakingIncentivesBatch>[0];

type ClaimState = ReturnType<typeof useClaimStakingIncentivesBatch>;
const HASH = '0xabc';

const renderModal = (claimState: Partial<ClaimState> = {}) => {
  const renders: ClaimProps[] = [];
  jest.mocked(useClaimStakingIncentivesBatch).mockImplementation((props) => {
    renders.push(props);
    return {
      claimIncentivesForBatch: jest.fn(),
      dismissPendingClaim: jest.fn(),
      isPending: false,
      isPreparing: false,
      pendingHash: undefined,
      canDismissPendingClaim: false,
      ...claimState,
    };
  });
  const view = render(<ClaimStakingIncentivesModal onClose={jest.fn()} />);
  const rerender = () => view.rerender(<ClaimStakingIncentivesModal onClose={jest.fn()} />);
  const latestProps = () => renders[renders.length - 1];
  const claimBatch = () => {
    act(() => latestProps().onSuccess());
    act(() => jest.advanceTimersByTime(STEP_CHANGE_DELAY));
  };
  return { latestProps, claimBatch, rerender };
};

describe('<ClaimStakingIncentivesModal />', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockBatches.current = BATCHES;
    mockLoadError.current = null;
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => jest.useRealTimers());

  it('records a claim that settles after a rebuild against the batch shown now', () => {
    const { latestProps, claimBatch } = renderModal();
    claimBatch();
    claimBatch();
    // The claim for batch 3 starts here; its callbacks close over this render.
    const propsWhenClaimStarted = latestProps();

    act(() => propsWhenClaimStarted.onBatchesRebuilt());
    act(() => propsWhenClaimStarted.onSuccess());

    expect(notifySuccess).toHaveBeenLastCalledWith(
      'Staking incentives for batch 1 claimed successfully',
    );
    expect(screen.getByText('Batch Claimed')).toBeInTheDocument();
  });

  it('clears the claimed marks on a rebuild so the rebuilt first batch can be claimed', () => {
    const { latestProps } = renderModal();
    act(() => latestProps().onSuccess());
    expect(screen.getByText('Batch Claimed')).toBeInTheDocument();

    act(() => latestProps().onBatchesRebuilt());

    expect(screen.queryByText('Batch Claimed')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Claim Incentives' })).toBeInTheDocument();
  });

  it('does not advance past the last batch when a rebuild shrank the list', () => {
    const { latestProps, claimBatch, rerender } = renderModal();
    claimBatch();
    const propsWhenClaimStarted = latestProps();

    mockBatches.current = [batch(4)];
    rerender();
    act(() => propsWhenClaimStarted.onBatchesRebuilt());
    act(() => propsWhenClaimStarted.onSuccess());
    act(() => jest.advanceTimersByTime(STEP_CHANGE_DELAY));

    expect(screen.getByText('Batch Claimed')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Claim Incentives' })).not.toBeInTheDocument();
  });

  it.each<[ClaimNotice, jest.Mock, string[]]>([
    [{ kind: 'wallet-rejected' }, notifyWarning as jest.Mock, ['Claim cancelled in your wallet']],
    [
      { kind: 'nothing-to-claim' },
      notifyWarning as jest.Mock,
      ['Someone else claimed these incentives. Nothing is left to claim.'],
    ],
    [
      { kind: 'claims-changed' },
      notifyWarning as jest.Mock,
      ['Claims changed while preparing the transaction'],
    ],
    [
      { kind: 'reverted-after-simulation' },
      notifyError as jest.Mock,
      ['The claim for batch 2 failed on-chain', 'Claim again to sign a new transaction.'],
    ],
    [
      { kind: 'other', message: 'Paused()' },
      notifyError as jest.Mock,
      ['Failed to claim staking incentives for batch 2', 'Paused()'],
    ],
    // Not failures: the claim may still mine, was not sent, or already settled.
    [
      { kind: 'still-pending', message: `pending: ${HASH}` },
      notifyWarning as jest.Mock,
      ['Claim not confirmed yet', `pending: ${HASH}`],
    ],
    [
      { kind: 'already-in-flight', message: 'in flight' },
      notifyWarning as jest.Mock,
      ['A claim is already in progress', 'in flight'],
    ],
    [
      { kind: 'refresh-failed', message: 'rate limited' },
      notifyWarning as jest.Mock,
      ['Could not refresh the claim list', 'rate limited'],
    ],
  ])('shows the %o error with its own message', (error, notifier, expectedArgs) => {
    const { latestProps, claimBatch } = renderModal();
    claimBatch();

    act(() => latestProps().onError(error));

    expect(notifier).toHaveBeenCalledTimes(1);
    expect(notifyError).toHaveBeenCalledTimes(notifier === notifyError ? 1 : 0);
    expect(notifier.mock.calls[0].slice(0, expectedArgs.length)).toEqual(expectedArgs);
  });

  it('shows a failed first load as an error, not as everything claimed', () => {
    mockBatches.current = [];
    mockLoadError.current = 'Could not read the claim cursor of staking contract 0x1';

    renderModal();

    expect(
      screen.getByText(
        'Could not load the claimable staking contracts: Could not read the claim cursor of staking contract 0x1',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('All staking incentives were claimed this epoch.')).toBeNull();
  });

  it('warns about a claim still being awaited, without offering a dismissal', () => {
    renderModal({ pendingHash: HASH, isPending: true });

    expect(screen.getByText(`pending: ${HASH}`)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull();
  });

  it('lets the user dismiss a claim whose wait ended without a receipt', () => {
    const dismissPendingClaim = jest.fn();
    renderModal({
      pendingHash: HASH,
      isPending: true,
      canDismissPendingClaim: true,
      dismissPendingClaim,
    });

    expect(screen.getByText(`pending: ${HASH}`)).toBeInTheDocument();
    act(() => screen.getByRole('button', { name: 'Dismiss' }).click());

    expect(dismissPendingClaim).toHaveBeenCalledTimes(1);
  });

  it('says the claim is being prepared while it is', () => {
    renderModal({ isPending: true, isPreparing: true });

    const button = screen.getByRole('button', { name: /Preparing claim/ });
    expect(button).toHaveClass('ant-btn-loading');
  });

  it('keeps the claim button loading while a sent claim is awaited', () => {
    renderModal({ isPending: true, isPreparing: false });

    const button = screen.getByRole('button', { name: /Claim Incentives/ });
    expect(button).toHaveClass('ant-btn-loading');
  });

  it('lets the user dismiss an earlier claim whose wallet request was never answered', () => {
    const dismissPendingClaim = jest.fn();
    renderModal({ isPending: true, canDismissPendingClaim: true, dismissPendingClaim });

    expect(screen.getByText(/still waiting for your wallet/)).toBeInTheDocument();
    act(() => screen.getByRole('button', { name: 'Dismiss' }).click());

    expect(dismissPendingClaim).toHaveBeenCalledTimes(1);
  });

  it.each<[boolean, jest.Mock, unknown[]]>([
    [true, notifySuccess as jest.Mock, [`Claim transaction ${HASH} was confirmed.`]],
    [
      false,
      notifyError as jest.Mock,
      [`Claim transaction ${HASH} failed on-chain`, 'Claim again to sign a new transaction.'],
    ],
  ])('reports a late receipt (claimed: %s) by its hash', (claimed, notifier, expectedArgs) => {
    const { latestProps } = renderModal();

    act(() => latestProps().onLateReceipt({ hash: HASH, claimed }));

    expect(notifier).toHaveBeenCalledWith(...expectedArgs);
  });

  it('warns that a failed receipt lookup leaves the claim pending, not failed', () => {
    const { latestProps } = renderModal();

    act(() => latestProps().onReceiptLookupFailed({ hash: HASH }));

    expect(notifyWarning).toHaveBeenCalledWith(
      `Could not check claim transaction ${HASH}`,
      'It may still be pending. Check your wallet or a block explorer.',
    );
    expect(notifyError).not.toHaveBeenCalled();
  });
});
