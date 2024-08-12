import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';

import { ContractPage } from './index';

jest.mock('next/router', () => {
  return {
    useRouter: jest.fn().mockReturnValue({
      query: { address: '0x0000000000000000000000007248d855a3d4d17c32eb0d996a528f7520d2f4a3' },
    }),
  };
});

jest.mock('store/index', () => ({
  useAppSelector: jest.fn().mockReturnValue({
    isStakingContractsLoading: false,
    stakingContracts: [
      {
        address: '0x0000000000000000000000007248d855a3d4d17c32eb0d996a528f7520d2f4a3',
        chainId: 1,
        metadata: {
          name: 'Staking Contract Name 1',
          description: 'Some good contract description.',
        },
      },
    ],
  }),
}));

jest.mock('components/Contract/hooks', () => ({
  useContractParams: jest.fn().mockReturnValue({
    data: {
      implementation: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      deployer: '0xdddddddddddddddddddddddddddddddddddddddd',
      isEnabled: true,
    },
  }),
  useGetActivityChecker: jest
    .fn()
    .mockReturnValue({ data: '0x0000000000000000000000000000000000000000' }),
  useGetAgentIds: jest.fn().mockReturnValue({ data: ['25'] }),
  useGetConfigHash: jest.fn().mockReturnValue({
    data: '0x0000000000000000000000000000000000000000000000000000000000000000',
  }),
  useGetLivenessPeriod: jest.fn().mockReturnValue({ data: '86400' }),
  useGetMaximumInactivityPeriods: jest.fn().mockReturnValue({ data: '2' }),
  useGetMinimumStakingDuration: jest.fn().mockReturnValue({ data: '259200' }),
  useTimeForEmissions: jest.fn().mockReturnValue({ data: '2592000' }),
  useNumberOfAgentInstances: jest.fn().mockReturnValue({ data: '1' }),
  useGetMultisigThreshold: jest.fn().mockReturnValue({ data: '1' }),
  useGetMinimumStakingDeposit: jest.fn().mockReturnValue({ data: '20' }),
  useMaxNumServices: jest.fn().mockReturnValue({ data: 200 }),
  useRewardsPerSecond: jest.fn().mockReturnValue({ data: 0.003 }),
}));

jest.mock('wagmi', () => ({
  useEnsName: jest.fn().mockReturnValue({ data: null }),
}));

describe('<ContractPage />', () => {
  it('should display contract name and description', () => {
    render(<ContractPage />);

    expect(screen.getByText(/Staking Contract Name 1/)).toBeInTheDocument();
    expect(screen.getByText(/Some good contract description./)).toBeInTheDocument();
  });

  it('should display contract owner address', () => {
    render(<ContractPage />);

    expect(screen.getByText(/Owner address/)).toBeInTheDocument();
    expect(screen.getByText(/0xddddd...ddddd ↗/)).toBeInTheDocument();
    expect(screen.getByTestId('owner-address').getAttribute('href')).toBe(
      'https://etherscan.io/address/0xdddddddddddddddddddddddddddddddddddddddd',
    );
  });

  it('should display contract chain name', () => {
    render(<ContractPage />);

    expect(screen.getByText(/Chain/)).toBeInTheDocument();
    expect(screen.getByText(/Ethereum/)).toBeInTheDocument();
  });

  it('should display contract address', () => {
    render(<ContractPage />);

    expect(screen.getByText(/Contract address/)).toBeInTheDocument();
    expect(screen.getByText(/0x7248d...2f4a3 ↗/)).toBeInTheDocument();
    expect(screen.getByTestId('contract-address').getAttribute('href')).toBe(
      'https://etherscan.io/address/0x7248d855a3d4d17c32eb0d996a528f7520d2f4a3',
    );
  });

  it.each([
    {
      testId: 'maximum-staked-agents',
      title: 'Maximum number of staked agents',
      value: '200',
    },
    {
      testId: 'rewards-per-second',
      title: 'Rewards, OLAS per second',
      value: '0.003',
    },
    {
      testId: 'minimum-staking-deposit',
      title: 'Minimum service staking deposit, OLAS',
      value: '20',
    },
    {
      testId: 'minimum-staking-periods',
      title: 'Minimum number of staking periods',
      value: '3',
    },
    {
      testId: 'maximum-inactivity-periods',
      title: 'Maximum number of inactivity periods',
      value: '2',
    },
    {
      testId: 'liveness-period',
      title: 'Liveness period, seconds',
      value: '86400',
    },
    {
      testId: 'time-for-emissions',
      title: 'Time for emissions, seconds',
      value: '2592000',
    },
    {
      testId: 'num-agent-instances',
      title: 'Number of agent instances',
      value: '1',
    },
    {
      testId: 'agent-ids',
      title: 'Agent IDs',
      value: '25',
    },
    {
      testId: 'multisig-threshold',
      title: 'Multisig threshold',
      value: '1',
    },
    {
      testId: 'service-config-hash',
      title: 'Service configuration hash',
      value: '0x00000...00000',
    },
    {
      testId: 'activity-checker-address',
      title: 'Activity checker address',
      value: '0x00000...00000 ↗',
    },
  ])('should display $title', async ({ testId, title, value }) => {
    render(<ContractPage />);
    const section = await screen.findByTestId(testId);

    expect(within(section).getByText(title)).toBeInTheDocument();
    expect(within(section).getByText(value)).toBeInTheDocument();
  });
});
