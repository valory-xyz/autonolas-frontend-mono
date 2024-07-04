import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FC } from 'react';
import { Allocation } from 'types';

import { ContractsList } from './ContractsList';

jest.mock('wagmi', () => ({
  useAccount: jest.fn().mockReturnValue({ address: '0x1234' }),
}));

jest.mock('hooks/useVotingPower', () => ({
  useVotingPower: jest.fn().mockReturnValue({ data: '75.05', isFetching: false }),
}));

jest.mock('store/index', () => ({
  useAppSelector: jest.fn().mockReturnValue({
    isStakingContractsLoading: false,
    stakingContracts: [
      {
        address: '0x0000000000000000000000007248d855a3d4d17c32eb0d996a528f7520d2f4a3',
        chainId: 100,
        currentWeight: { percentage: 0.0001837161934499, value: 5.590708218931387 },
        nextWeight: { percentage: 0.000181297889076, value: 5.489994520303767 },
        metadata: {
          name: 'Implement Governance Solutions',
          description:
            'Establish frameworks and mechanisms to manage and regulate decentralized systems or organizations effectively.',
        },
      },
      {
        address: '0x00000000000000000000000014d28bfcc328e12732551efbb771384261761ac6',
        chainId: 1,
        currentWeight: { percentage: 10.123456, value: 298892.4460914383 },
        nextWeight: { percentage: 25.55555, value: 297434.39744027395 },
        metadata: {
          name: 'Explore Decentralized Finance (DeFi)',
          description:
            'Dive into the world of decentralized financial instruments and protocols, offering alternative ways to borrow, lend, trade, and invest without traditional intermediaries.',
        },
      },
    ],
  }),
}));

const allocationsMock: Allocation[] = [
  {
    address: '0x0000000000000000000000007248d855a3d4d17c32eb0d996a528f7520d2f4a3',
    chainId: 100,
    metadata: {
      name: 'Implement Governance Solutions',
      description:
        'Establish frameworks and mechanisms to manage and regulate decentralized systems or organizations effectively.',
    },
    weight: 50,
  },
];

const ContractListExample: FC<{ handleAdd?: () => void }> = ({ handleAdd = () => {} }) => {
  return <ContractsList isUpdating={true} handleAdd={handleAdd} allocations={allocationsMock} />;
};

describe('<ContractsList />', () => {
  it('should display contract name and description', () => {
    render(<ContractListExample />);

    expect(screen.getByText(/All staking contracts/)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Decide which staking contracts receive the most incentives, attract the most agents, and grow./,
      ),
    ).toBeInTheDocument();
  });

  it('should display table columns', () => {
    render(<ContractListExample />);

    expect(screen.getByText(/Staking contract/)).toBeInTheDocument();
    expect(screen.getByText(/Current weight/)).toBeInTheDocument();
    expect(screen.getByText(/Next week weight/)).toBeInTheDocument();
    expect(screen.getByText(/Actions/)).toBeInTheDocument();
  });

  // checking 2nd row of the table
  it('should display staking contracts row in table', () => {
    render(<ContractListExample />);

    // staking contract column
    expect(screen.getByText('Explore Decentralized Finance (DeFi)')).toBeInTheDocument();
    expect(screen.getByText(/Ethereum/)).toBeInTheDocument();

    // current weight column
    expect(screen.getByText(/10.12%/)).toBeInTheDocument();
    expect(screen.getByText(/298.8k veOlas/)).toBeInTheDocument();

    // next weight column
    expect(screen.getByText(/25.56%/)).toBeInTheDocument();
    expect(screen.getByText(/297.4k veOlas/)).toBeInTheDocument();
  });

  describe('Already voted', () => {
    it('should display already voted message', () => {
      render(<ContractListExample />);

      const firstRow = screen.getByText('Implement Governance Solutions').closest('tr');
      if (!firstRow) throw new Error('Row not found');

      // check if the button is disabled
      const addBtn = within(firstRow).getByText('Added').closest('button');
      expect(addBtn).toBeInTheDocument();
      expect(addBtn).toBeDisabled();
    });
  });

  describe('Yet to vote', () => {
    it('should display add button', async () => {
      const handleAddFn = jest.fn();
      render(<ContractListExample handleAdd={handleAddFn} />);

      const secondRow = screen.getByText('Explore Decentralized Finance (DeFi)').closest('tr');
      if (!secondRow) throw new Error('Row not found');

      // check if the button is enabled
      const addBtn = within(secondRow).getByText('Add').closest('button');

      if (!addBtn) throw new Error('Add button not found');
      await userEvent.click(addBtn);
      expect(handleAddFn).toHaveBeenCalledTimes(1);
    });
  });
});
