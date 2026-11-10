import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import type { Address } from 'viem';

import { notifyError, notifySuccess, notifyWarning } from 'libs/util-functions/src';
import type { ClaimBatch, ClaimError } from 'common-util/functions/staking-incentives-claim';
import { useClaimStakingIncentivesBatch } from 'hooks/useClaimStakingIncentivesBatch';

import { ClaimStakingIncentivesModal } from './ClaimStakingIncentivesModal';

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
jest.mock('hooks/useClaimableNomineeBatches', () => ({
  useClaimableNomineesBatches: () => ({
    nomineesToClaimBatches: BATCHES,
    isLoadingClaimableBatches: false,
    clearClaimableBatches: jest.fn(),
    refetchClaimableBatches: jest.fn(),
  }),
}));
jest.mock('hooks/useClaimStakingIncentivesBatch', () => ({
  useClaimStakingIncentivesBatch: jest.fn(),
}));

type ClaimProps = Parameters<typeof useClaimStakingIncentivesBatch>[0];
const STEP_CHANGE_DELAY = 1000;

const renderModal = () => {
  const renders: ClaimProps[] = [];
  jest.mocked(useClaimStakingIncentivesBatch).mockImplementation((props) => {
    renders.push(props);
    return { claimIncentivesForBatch: jest.fn(), isPending: false, isPreparing: false };
  });
  render(<ClaimStakingIncentivesModal onClose={jest.fn()} />);
  const latestProps = () => renders[renders.length - 1];
  const claimBatch = () => {
    act(() => latestProps().onSuccess());
    act(() => jest.advanceTimersByTime(STEP_CHANGE_DELAY));
  };
  return { latestProps, claimBatch };
};

describe('<ClaimStakingIncentivesModal />', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
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

  it.each<[ClaimError, jest.Mock, string[]]>([
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
      ['The claim for batch 2 failed on-chain'],
    ],
    [
      { kind: 'other', message: 'Paused()' },
      notifyError as jest.Mock,
      ['Failed to claim staking incentives for batch 2', 'Paused()'],
    ],
  ])('shows the %o error with its own message', (error, notifier, expectedArgs) => {
    const { latestProps, claimBatch } = renderModal();
    claimBatch();

    act(() => latestProps().onError(error));

    expect(notifier).toHaveBeenCalledTimes(1);
    expect(notifier.mock.calls[0].slice(0, expectedArgs.length)).toEqual(expectedArgs);
  });
});
