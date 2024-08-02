import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';

import { Details } from './index';

jest.mock('next/router', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    query: { id: '0x11111111111111111111111111111111111111' },
  }),
}));

jest.mock('store/index', () => ({
  useAppSelector: jest.fn().mockReturnValue({
    networkId: 1,
    networkName: 'ethereum',
    networkDisplayName: 'Ethereum',
    myStakingContracts: [
      {
        id: '0x11111111111111111111111111111111111111',
        chainId: 1,
        name: 'My contract one',
        description: 'Some good description one',
        template: 'Staking Token',
        isNominated: false,
      },
    ],
  }),
}));

jest.mock('hooks/useGetStakingConstants', () => ({
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
}));

jest.mock('./hooks', () => ({
  useMaxNumServices: jest.fn().mockReturnValue({ data: 200 }),
  useRewardsPerSecond: jest.fn().mockReturnValue({ data: 0.003 }),
}));

describe('<Details />', () => {
  it('should display contract name', () => {
    render(<Details />);

    expect(screen.getByText('Contract #1 My contract one')).toBeInTheDocument();
  });

  it('should display nominate info if the staking contract is NOT nominated', () => {
    render(<Details />);

    expect(screen.getByTestId('nominate-info').textContent).toBe(
      'Nominate your contract to make it eligible to receive staking incentives. Staking incentives are allocated via Govern ↗.',
    );
  });

  it('should display nomination info and address', () => {
    render(<Details />);

    expect(screen.getByText('Nominated for incentives?')).toBeInTheDocument();

    // nominate button
    const nominateBtn = screen.getByRole('button', { name: 'Nominate' });
    if (!nominateBtn) throw new Error('No nominate button found');
    expect(nominateBtn).toBeInTheDocument();
    expect(nominateBtn).toBeEnabled();

    // address
    expect(screen.getByText('Address')).toBeInTheDocument();
    expect(screen.getByText('0x11111...11111 ↗')).toBeInTheDocument();
  });

  it('should display description', () => {
    render(<Details />);

    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Some good description one')).toBeInTheDocument();
  });

  it('should display template and chain', () => {
    render(<Details />);

    // template
    expect(screen.getByText('Template')).toBeInTheDocument();
    expect(screen.getByText('Staking Token')).toBeInTheDocument();
    expect(screen.getByText('View on explorer ↗')).toBeInTheDocument();

    // chain
    expect(screen.getByText('Chain')).toBeInTheDocument();
    expect(screen.getByText('Ethereum')).toBeInTheDocument();
  });

  // Contract configuration
  it('should display contract configuration', () => {
    render(<Details />);

    expect(screen.getByText('Contract configuration')).toBeInTheDocument();
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
      value: '0.003 OLAS',
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
      title: 'Liveness period',
      value: '86400 seconds',
    },
    {
      testId: 'time-for-emissions',
      title: 'Time for emissions',
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
    render(<Details />);
    const minStakingDepositSection = await screen.findByTestId(testId);

    expect(within(minStakingDepositSection).getByText(title)).toBeInTheDocument();
    expect(within(minStakingDepositSection).getByText(value)).toBeInTheDocument();
  });
});
