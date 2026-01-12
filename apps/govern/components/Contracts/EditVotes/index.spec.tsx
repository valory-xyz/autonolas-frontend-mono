import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FC } from 'react';
import { Allocation, StakingContract } from 'types';

import { useAppSelector } from 'store/index';

import { EditVotes } from '.';

jest.mock('wagmi', () => ({
  useAccount: jest.fn().mockReturnValue({ address: '0x1234', isConnected: true }),
}));
jest.mock('common-util/functions/requests', () => ({ voteForNomineeWeights: jest.fn() }));
jest.mock('context/Web3ModalProvider', () => ({
  queryClient: jest.fn().mockReturnValue({ removeQueries: jest.fn() }),
}));
jest.mock('hooks/index', () => ({ useVotingPower: jest.fn() }));
jest.mock('store/index', () => ({
  useAppSelector: jest.fn(),
  useAppDispatch: jest.fn().mockReturnValue(jest.fn()),
}));

const mockContract1 = {
  address: '0x0000000000000000000000007248d855a3d4d17c32eb0d996a528f7520d2f4a3',
  chainId: 1,
  currentWeight: { percentage: 0.0001837161934499, value: 5.590708218931387 },
  nextWeight: { percentage: 0.000181297889076, value: 5.489994520303767 },
  metadata: {
    name: 'Staking Contract Name 1',
    description: 'Some good contract description.',
  },
} as StakingContract;

const mockContract2 = {
  address: '0x000000000000000000000000e26ae1aa2bc8d499014cfcb134beef371a89016f',
  chainId: 1,
  currentWeight: { percentage: 0.0001512505730559, value: 4.602739726001887 },
  nextWeight: { percentage: 0.0001488311626139, value: 4.506849315042103 },
  metadata: {
    name: 'Engage in Yield Farming Strategies',
    description:
      'Optimize returns by strategically providing liquidity to decentralized finance platforms and earning rewards through various yield farming techniques.',
  },
  weight: 500,
} as StakingContract;

const multipleContractsMock = [mockContract1, mockContract2];

const EditVotesExample: FC<{
  allocationsMock?: Allocation[];
  setAllocationsMock?: () => void;
}> = ({
  allocationsMock = [{ ...mockContract1, weight: 5 } as Allocation],
  setAllocationsMock,
}) => {
  return (
    <EditVotes
      allocations={allocationsMock}
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      setAllocations={setAllocationsMock || (() => {})}
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      setIsUpdating={() => {}}
    />
  );
};

describe('<EditVotes />', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useAppSelector as jest.Mock).mockReturnValue({
      stakingContracts: mockContract1,
      userVotes: {},
    });
  });

  it('should display voting power', () => {
    render(<EditVotesExample />);

    expect(screen.getByText('Voting power used')).toBeInTheDocument();
    expect(screen.getByTestId('total-allocated-power').textContent).toBe('5%');
  });

  it('should display table column names and sub text', () => {
    render(<EditVotesExample />);

    expect(screen.getByText('Contract name')).toBeInTheDocument();
    expect(screen.getByText('Chain')).toBeInTheDocument();
    expect(screen.getByText('My voting weight')).toBeInTheDocument();

    expect(
      screen.getByText(
        /Updated voting weights will take effect at the start of next week \(according to Unix time\)./,
      ),
    ).toBeInTheDocument();
  });

  describe('Voting contract row', () => {
    it('should display staking contract name and chain', async () => {
      render(<EditVotesExample />);

      expect(screen.getByText(mockContract1.metadata.name)).toBeInTheDocument();
      expect(screen.getByText('Ethereum')).toBeInTheDocument();
    });

    it('should display voting weight input', async () => {
      render(<EditVotesExample />);

      const votingWeightInput = screen.getByTestId('my-voting-weight-input-0') as HTMLInputElement;
      expect(votingWeightInput.value).toBe('5.00');
      expect(votingWeightInput).toBeEnabled();
    });

    it('should display remove button', async () => {
      const setAllocationsMock = jest.fn();
      render(<EditVotesExample setAllocationsMock={setAllocationsMock} />);

      const removeButton = screen.getByTestId('remove-allocation-button-0');
      expect(removeButton).toBeInTheDocument();

      await userEvent.click(removeButton);
      expect(setAllocationsMock).toHaveBeenCalledTimes(1);
    });

    it('should enable update button if there is a change in voting weight', async () => {
      render(<EditVotesExample />);

      const votingWeightInput = screen.getByTestId('my-voting-weight-input-0') as HTMLInputElement;
      expect(votingWeightInput.value).toBe('5.00');

      userEvent.clear(votingWeightInput);
      userEvent.type(votingWeightInput, '10');

      const updateButton = screen.getByRole('button', { name: 'Update voting weight' });
      expect(updateButton as HTMLButtonElement).toBeEnabled();
    });
  });

  describe('Voting weight error', () => {
    beforeEach(() => {
      jest.clearAllMocks();

      (useAppSelector as jest.Mock).mockReturnValue({
        stakingContracts: multipleContractsMock,
        userVotes: {},
      });
    });

    it('should show error if voting weight is more than 100% and update button should be disabled', async () => {
      render(
        <EditVotesExample
          allocationsMock={[
            { ...mockContract1, weight: 100 } as Allocation,
            { ...mockContract2, weight: 150 } as Allocation,
          ]}
        />,
      );

      const errorMessage = screen.getByText(/Total voting power entered must not exceed 100%/);
      expect(errorMessage).toBeInTheDocument();

      const updateButton = screen.getByRole('button', { name: 'Update voting weight' });
      expect(updateButton as HTMLButtonElement).toBeDisabled();
    });
  });
});
