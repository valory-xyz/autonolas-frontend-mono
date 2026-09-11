import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { StakingContract } from 'types';

import { ContractsPage } from './index';

const mockUseStakingContractsList = jest.fn();

jest.mock('./hooks', () => ({
  useStakingContractsList: () => mockUseStakingContractsList(),
}));

jest.mock('components/RunAgentButton', () => ({
  RunAgentButton: ({ availableOn }: { availableOn: string }) => <button>{availableOn}</button>,
}));

const SNAPSHOT: StakingContract[] = [
  {
    key: '0x0000000000000000000000007248d855a3d4d17c32eb0d996a528f7520d2f4a3',
    address: '0x7248d855a3d4d17c32eb0d996a528f7520d2f4a3',
    chainId: 100,
    metadata: { name: 'Prerendered Contract', description: 'From the ISR snapshot.' },
    availableSlots: 5,
    maxSlots: 10,
    apy: 100,
    stakeRequired: '10000',
    availableOn: ['pearl'],
    availableRewards: '15170',
    epoch: 129,
    timeRemaining: '0D 4H 22M',
    epochEndsAt: '2026-09-07T18:42:00.000Z',
  },
];

describe('ContractsPage pre-rendered snapshot', () => {
  beforeEach(() => {
    // Nothing resolved yet: what the server render and the first client render both see.
    mockUseStakingContractsList.mockReturnValue({ contracts: [], isLoading: true });
  });

  // Guards the Phase 2 contract: this table must ship real rows in the server HTML.
  it('renders snapshot rows before the client hook resolves', () => {
    render(<ContractsPage initialContracts={SNAPSHOT} />);

    expect(screen.getByText('Prerendered Contract')).toBeInTheDocument();
    expect(screen.queryByText('No data')).not.toBeInTheDocument();
  });

  // A cached countdown is wrong by the time most readers see it; the absolute time is not.
  it('publishes an absolute epoch end alongside the relative countdown', () => {
    render(<ContractsPage initialContracts={SNAPSHOT} />);

    expect(screen.getByText('0D 4H 22M')).toBeInTheDocument();
    expect(screen.getByText(/Epoch 129 ends 7 Sep 2026, 18:42 UTC/)).toBeInTheDocument();
  });

  it('states the scope and when the snapshot was taken', () => {
    render(
      <ContractsPage initialContracts={SNAPSHOT} snapshotGeneratedAt="2026-09-07T18:00:00.000Z" />,
    );

    expect(screen.getByText(/1 Olas staking contract is listed below/)).toBeInTheDocument();
    expect(screen.getByText(/snapshot taken 7 Sep 2026, 18:00 UTC/)).toBeInTheDocument();
  });

  // The hidden summary must describe the rows actually served, not the full set: only the
  // selected tab is rendered, so counting everything would claim contracts the HTML lacks.
  it('counts only the rows it actually renders, and accounts for the rest', () => {
    const notAvailable: StakingContract = {
      ...SNAPSHOT[0],
      key: '0x0000000000000000000000009999999999999999999999999999999999999999',
      address: '0x9999999999999999999999999999999999999999',
      metadata: { name: 'Not Available Contract', description: 'No platform yet.' },
      availableOn: null,
    };

    render(<ContractsPage initialContracts={[...SNAPSHOT, notAvailable]} />);

    // The Live tab is selected, so only the one live contract is in the DOM.
    expect(screen.getByText('Prerendered Contract')).toBeInTheDocument();
    expect(screen.queryByText('Not Available Contract')).not.toBeInTheDocument();

    expect(screen.getByText(/1 Olas staking contract is listed below/)).toBeInTheDocument();
    expect(
      screen.getByText(/A further 1 registered contract is not yet available on any platform/),
    ).toBeInTheDocument();
  });

  it('never renders the bare "No data" empty state', () => {
    render(<ContractsPage initialContracts={[]} />);

    expect(screen.queryByText('No data')).not.toBeInTheDocument();
    expect(screen.getByText(/each contract in this table lists/i)).toBeInTheDocument();
  });
});
