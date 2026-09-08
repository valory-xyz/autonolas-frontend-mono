import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { StakingContract } from 'types';

import { ContractsList } from './ContractsList';

jest.mock('wagmi', () => ({
  useAccount: jest.fn().mockReturnValue({ address: undefined }),
}));

jest.mock('hooks/useVotingPower', () => ({
  useVotingPower: jest.fn().mockReturnValue({ data: '0', isFetching: false }),
}));

// An empty store, still loading: what the server render and the first client render both see.
jest.mock('store/index', () => ({
  useAppSelector: jest.fn().mockReturnValue({
    isStakingContractsLoading: true,
    stakingContracts: [],
  }),
}));

const SNAPSHOT: StakingContract[] = [
  {
    address: '0x0000000000000000000000007248d855a3d4d17c32eb0d996a528f7520d2f4a3',
    chainId: 100,
    currentWeight: { percentage: 1.5, value: 100 },
    nextWeight: { percentage: 2.5, value: 200 },
    metadata: { name: 'Prerendered Contract', description: 'From the ISR snapshot.' },
  },
];

const renderList = (props: Partial<React.ComponentProps<typeof ContractsList>> = {}) =>
  render(<ContractsList isUpdating={false} handleAdd={() => {}} allocations={[]} {...props} />);

describe('ContractsList pre-rendered snapshot', () => {
  // Guards the Phase 2 contract: this table must ship real rows in the server HTML.
  // `initialContracts` reaching the store via a useEffect instead of a prop was the bug in an
  // earlier attempt — effects do not run during a server render, so the HTML stayed empty.
  it('renders snapshot rows while the store is still empty', () => {
    renderList({ initialContracts: SNAPSHOT });

    expect(screen.getByText('Prerendered Contract')).toBeInTheDocument();
    expect(screen.queryByText('No data')).not.toBeInTheDocument();
  });

  it('states what the figures are and when the snapshot was taken', () => {
    renderList({
      initialContracts: SNAPSHOT,
      snapshotGeneratedAt: '2026-09-07T18:42:00.000Z',
    });

    expect(screen.getByText(/7 Sep 2026, 18:42 UTC/)).toBeInTheDocument();
  });

  it('never renders the bare "No data" empty state', () => {
    renderList({ initialContracts: [] });

    expect(screen.queryByText('No data')).not.toBeInTheDocument();
    expect(screen.getByText(/each contract in this table lists/i)).toBeInTheDocument();
  });
});
