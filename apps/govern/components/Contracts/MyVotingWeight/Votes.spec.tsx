import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import React from 'react';

import { Votes } from './Votes';

jest.mock('wagmi', () => ({
  useAccount: jest.fn().mockReturnValue({ address: '0x1234', isConnected: true }),
}));

jest.mock('@wagmi/core', () => ({
  readContract: jest.fn(),
  readContracts: jest.fn(),
}));

jest.mock('context/Web3ModalProvider', () => ({
  queryClient: jest.fn(),
}));

jest.mock('hooks/useRemovedNominees', () => ({
  useRemovedVotedNominees: jest.fn().mockReturnValue({
    removedVotedNominees: [],
    isLoading: false,
  }),
}));

jest.mock('store/index', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn().mockReturnValue({
    lastUserVote: Date.now(),
    userVotes: {
      '0x0000000000000000000000007248d855a3d4d17c32eb0d996a528f7520d2f4a3': {
        current: { power: 5, slope: 0, end: 0 },
        next: { power: 50, slope: 0, end: 0 },
      },
    },
    stakingContracts: [
      {
        address: '0x0000000000000000000000007248d855a3d4d17c32eb0d996a528f7520d2f4a3',
        chainId: 1,
        currentWeight: { percentage: 0.0001837161934499, value: 5.590708218931387 },
        nextWeight: { percentage: 0.000181297889076, value: 5.489994520303767 },
        metadata: {
          name: 'Staking Contract Name 1',
          description: 'Some good contract description.',
        },
      },
    ],
  }),
}));

const VotesExample = () => {
  return <Votes setIsUpdating={jest.fn()} setAllocations={jest.fn()} />;
};

describe('<Votes />', () => {
  it('should display countdown if voting is blocked', () => {
    render(<VotesExample />);

    expect(screen.getByText(/Cooldown period/)).toBeInTheDocument();
    expect(screen.getByText(/9d 23h 59m/)).toBeInTheDocument();

    const updateBtn = screen.getByRole('button', { name: /Update voting weight/ });
    expect(updateBtn).toBeDisabled();
  });

  it('should display "Update voting weight" button', () => {
    render(<VotesExample />);

    const updateBtn = screen.getByRole('button', { name: /Update voting weight/ });
    expect(updateBtn).toBeInTheDocument();
  });

  it('should display votes table column', () => {
    render(<VotesExample />);

    expect(screen.getByText(/Staking contract/)).toBeInTheDocument();
    expect(screen.getByText(/My current weight/)).toBeInTheDocument();
    expect(screen.getByText(/My updated weight/)).toBeInTheDocument();
  });

  it('should display votes rows', () => {
    render(<VotesExample />);

    expect(screen.getByText(/Staking Contract Name 1/)).toBeInTheDocument();
    expect(screen.getByText(/Ethereum/)).toBeInTheDocument();
    expect(screen.getByText(/5%/)).toBeInTheDocument();
    expect(screen.getByText(/50%/)).toBeInTheDocument();
  });
});
