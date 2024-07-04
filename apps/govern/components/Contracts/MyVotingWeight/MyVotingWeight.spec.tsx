import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Allocation } from 'types';
import { useAccount } from 'wagmi';

import { useVotingPower } from 'hooks/index';

import { MyVotingWeight } from './MyVotingWeight';

jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
}));

jest.mock('hooks/index', () => ({
  useVotingPower: jest.fn(),
}));

jest.mock('store/index', () => ({
  useAppSelector: jest.fn().mockReturnValue({
    userVotes: {},
    // stakingContracts: [
    //   {
    //     address: '0x00000000000000000000000014d28bfcc328e12732551efbb771384261761ac6',
    //     chainId: 1,
    //     currentWeight: { percentage: 10.123456, value: 298892.4460914383 },
    //     nextWeight: { percentage: 25.55555, value: 297434.39744027395 },
    //     metadata: {
    //       name: 'Explore Decentralized Finance (DeFi)',
    //       description:
    //         'Dive into the world of decentralized financial instruments and protocols, offering alternative ways to borrow, lend, trade, and invest without traditional intermediaries.',
    //     },
    //   },
    // ],
  }),
}));

jest.mock('components/Login', () => ({ LoginV2: 'Login' }));
jest.mock('../EditVotes', () => ({ EditVotes: 'EditVotes' }));
jest.mock('./Votes', () => ({ Votes: 'Votes' }));

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

  // it('should display "Voting power used"', () => {
  //   render(<MyVotingWeightExample />);

  //   expect(screen.getByText('Voting power used')).toBeInTheDocument();
  //   expect(screen.getByText('75.05%')).toBeInTheDocument();
  // });

  // it('should display table column names and sub text', () => {
  //   expect(screen.getByText('Contract name')).toBeInTheDocument();
  //   expect(screen.getByText('Chain')).toBeInTheDocument();
  //   expect(screen.getByText('My voting weight')).toBeInTheDocument();

  //   expect(
  //     screen.getByText(/New voting weight will take effect at the beginning of the next week./),
  //   ).toBeInTheDocument();
  // });

  // describe('No voting power', () => {
  //   beforeEach(() => {
  //     (useVotingPower as jest.Mock).mockReturnValue({ data: '0' });
  //     (useAccount as jest.Mock).mockReturnValue({ address: '0x1234' });
  //   });

  //   it('should display "Get veOlas" message', () => {
  //     render(<MyVotingWeightExample />);

  //     expect(
  //       screen.getByText(/Only veOLAS holders can vote on staking contracts./),
  //     ).toBeInTheDocument();
  //     expect(screen.getByText(/Please lock OLAS for veOLAS to get started./)).toBeInTheDocument();

  //     expect(screen.getByText('Get veOLAS').closest('button')).toBeInTheDocument();
  //   });
  // });
});

/**
 * check "Connect Wallet" if not connected?
 *
 */
