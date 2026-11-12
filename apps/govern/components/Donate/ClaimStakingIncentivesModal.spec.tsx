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
    getClaimedThrough: jest.fn(),
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
      claimButtonState: 'idle',
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

  it('names the batch shown now when a claim fails after a rebuild', () => {
    const { latestProps, claimBatch } = renderModal();
    claimBatch();
    claimBatch();
    const propsWhenClaimStarted = latestProps();

    act(() => propsWhenClaimStarted.onBatchesRebuilt());
    act(() => propsWhenClaimStarted.onNotice({ kind: 'other', message: 'x' }));

    expect(notifyError).toHaveBeenLastCalledWith(
      'Failed to claim staking incentives for batch 1',
      'x',
    );
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

  it.each<[ClaimNotice, typeof notifyError, string[]]>([
    [
      { kind: 'reverted-after-simulation' },
      notifyError,
      ['The claim for batch 2 failed on-chain', 'Claim again to sign a new transaction.'],
    ],
    [
      { kind: 'other', message: 'Paused()' },
      notifyError,
      ['Failed to claim staking incentives for batch 2', 'Paused()'],
    ],
    // Not failures: cancelled, nothing changed hands, the claim may still mine, or it was not sent.
    [{ kind: 'wallet-rejected' }, notifyWarning, ['Claim cancelled in your wallet']],
    [
      { kind: 'nothing-to-claim' },
      notifyWarning,
      ['These incentives were already claimed. Nothing is left to claim.'],
    ],
    [
      { kind: 'claims-changed' },
      notifyWarning,
      [
        'Claims changed while preparing the transaction',
        'The list has been refreshed. Review it and claim again.',
      ],
    ],
    [
      { kind: 'still-pending', hash: HASH, timedOut: true },
      notifyWarning,
      ['Claim not confirmed yet', `pending: ${HASH}`],
    ],
    [
      { kind: 'still-pending', hash: HASH, timedOut: false },
      notifyWarning,
      [
        'Claim not confirmed yet',
        `Could not confirm transaction ${HASH}. Check your wallet before claiming again.`,
      ],
    ],
    [
      { kind: 'already-in-flight', message: 'in flight' },
      notifyWarning,
      ['A claim is already in progress', 'in flight'],
    ],
    [
      { kind: 'refresh-failed', message: 'rate limited' },
      notifyWarning,
      ['Could not refresh the claim list', 'rate limited'],
    ],
  ])(
    'shows the %o notice with its own message, and logs it by kind',
    (notice, notifier, expectedArgs) => {
      const errorLog = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const warnLog = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { latestProps, claimBatch } = renderModal();
      claimBatch();

      act(() => latestProps().onNotice(notice));

      const isFailure = notifier === notifyError;
      expect(notifier).toHaveBeenCalledTimes(1);
      expect(notifyError).toHaveBeenCalledTimes(isFailure ? 1 : 0);
      expect(notifier).toHaveBeenCalledWith(...expectedArgs);
      expect([errorLog.mock.calls, warnLog.mock.calls]).toEqual(
        isFailure ? [[[notice]], []] : [[], [[notice]]],
      );
      errorLog.mockRestore();
      warnLog.mockRestore();
    },
  );

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

  it('shows a read error in place of an already loaded list, so no claim starts from it', () => {
    mockLoadError.current = 'Could not read the vote weight of staking contract 0x1';

    renderModal();

    expect(
      screen.getByText(
        'Could not load the claimable staking contracts: Could not read the vote weight of staking contract 0x1',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Claim Incentives' })).toBeNull();
  });

  it('warns about a claim still being awaited, without offering a dismissal', () => {
    renderModal({ pendingHash: HASH, claimButtonState: 'pending' });

    expect(screen.getByText(`pending: ${HASH}`)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull();
  });

  it('lets the user dismiss a claim whose wait ended without a receipt', () => {
    const dismissPendingClaim = jest.fn();
    renderModal({
      pendingHash: HASH,
      canDismissPendingClaim: true,
      dismissPendingClaim,
    });

    expect(screen.getByText(`pending: ${HASH}`)).toBeInTheDocument();
    act(() => screen.getByRole('button', { name: 'Dismiss' }).click());

    expect(dismissPendingClaim).toHaveBeenCalledTimes(1);
  });

  it('says the claim is being prepared while it is', () => {
    renderModal({ claimButtonState: 'preparing' });

    const button = screen.getByRole('button', { name: /Preparing claim/ });
    expect(button).toHaveClass('ant-btn-loading');
  });

  it('leaves the claim button clickable when no claim is in flight', () => {
    renderModal({ claimButtonState: 'idle' });

    const button = screen.getByRole('button', { name: /Claim Incentives/ });
    expect(button).not.toHaveClass('ant-btn-loading');
  });

  it('keeps the claim button loading while a sent claim is awaited', () => {
    renderModal({ claimButtonState: 'pending' });

    const button = screen.getByRole('button', { name: /Claim Incentives/ });
    expect(button).toHaveClass('ant-btn-loading');
  });

  it('lets the user dismiss an earlier claim whose wallet request was never answered', () => {
    const dismissPendingClaim = jest.fn();
    renderModal({ canDismissPendingClaim: true, dismissPendingClaim });

    expect(screen.getByText(/still waiting for your wallet/)).toBeInTheDocument();
    act(() => screen.getByRole('button', { name: 'Dismiss' }).click());

    expect(dismissPendingClaim).toHaveBeenCalledTimes(1);
  });

  it.each<[boolean, typeof notifyError, unknown[]]>([
    [true, notifySuccess, [`Claim transaction ${HASH} was confirmed.`]],
    [
      false,
      notifyError,
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
