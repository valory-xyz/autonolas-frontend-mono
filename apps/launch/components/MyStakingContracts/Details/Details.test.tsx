import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { Details } from './Details';

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

  it('should display max num services and rewards per second', () => {
    render(<Details />);

    expect(screen.getByText('Maximum number of staked services')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();

    expect(screen.getByText('Rewards, OLAS per second')).toBeInTheDocument();
    expect(screen.getByText('0.003 OLAS')).toBeInTheDocument();
  });
});
