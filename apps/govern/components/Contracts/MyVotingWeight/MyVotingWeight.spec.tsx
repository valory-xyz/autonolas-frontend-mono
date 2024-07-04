import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Allocation } from 'types';
import { useAccount } from 'wagmi';

import { useVotingPower } from 'hooks/index';

import { MyVotingWeight } from './MyVotingWeight';

jest.mock('wagmi', () => ({ useAccount: jest.fn() }));
jest.mock('hooks/index', () => ({ useVotingPower: jest.fn() }));
jest.mock('store/index', () => ({
  useAppSelector: jest.fn().mockReturnValue({
    userVotes: {},
    stakingContracts: [],
  }),
}));
jest.mock('components/Login', () => ({ LoginV2: 'Login' }));
jest.mock('../EditVotes/EditVotes', () => ({ EditVotes: 'EditVotes' }));
jest.mock('./Votes', () => ({ Votes: 'Votes' }));

const allocationsMock: Allocation[] = [];

const MyVotingWeightExample = () => {
  return (
    <MyVotingWeight
      isUpdating={false}
      setIsUpdating={() => {}}
      allocations={allocationsMock}
      setAllocations={() => {}}
    />
  );
};

describe('<MyVotingWeight/>', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useVotingPower as jest.Mock).mockReturnValue({ data: '75.05' });
    (useAccount as jest.Mock).mockReturnValue({ address: '0x1234', isConnected: true });
  });

  it('should display title and description', () => {
    render(<MyVotingWeightExample />);

    expect(screen.getByText(/My voting weight/)).toBeInTheDocument();
    expect(
      screen.getByText(
        'Allocate your voting power to direct OLAS emissions to different staking contracts.',
      ),
    ).toBeInTheDocument();
  });

  it('should display no staking contracts to vote message', () => {
    render(<MyVotingWeightExample />);

    expect(
      screen.getByText(/You haven't added any staking contracts to vote on yet./),
    ).toBeInTheDocument();
  });
});
