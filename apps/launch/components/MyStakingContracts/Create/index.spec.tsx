import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CreateStakingContract } from './index';

jest.mock('wagmi', () => ({
  useAccount: jest.fn().mockReturnValue({
    address: '0x12345',
    chain: { id: 1 },
  }),
}));

jest.mock('@wagmi/core', () => ({
  readContract: jest.fn().mockReturnValue({}),
}));

jest.mock('next/router', () => ({
  useRouter: jest.fn().mockReturnValue({ push: jest.fn() }),
}));

jest.mock('hooks/useStakingVerifier', () => ({
  useNumServicesLimit: jest.fn().mockReturnValue({ data: 100 }),
  useMinStakingDepositLimit: jest.fn().mockReturnValue({ data: 1000 }),
  useTimeForEmissionsLimit: jest.fn().mockReturnValue({ data: 259200 }),
  useApyLimit: jest.fn().mockReturnValue({ data: 3000000000000000000 }),
}));

jest.mock('common-util/functions/stakingContract', () => ({
  getStakingContractInitPayload: jest.fn().mockReturnValue('encodedPayload'),
}));

jest.mock('store/index', () => ({
  useAppSelector: jest.fn().mockReturnValue({
    networkId: 1,
    networkName: 'ethereum',
    networkDisplayName: 'Ethereum',
  }),
  useAppDispatch: jest.fn().mockReturnValue(jest.fn()),
}));

describe('<CreateStakingContract />', () => {
  it('should display title of the staking contract form', () => {
    render(<CreateStakingContract />);

    expect(screen.getByText(/Create staking contract on Ethereum/i)).toBeInTheDocument();
  });

  it('should display `Name` field as required and able to fill the `Name` field', async () => {
    render(<CreateStakingContract />);

    const nameInput = screen.getByLabelText('Name');
    expect(nameInput).toBeRequired();

    await userEvent.type(nameInput, 'My Staking Contract');
    expect(nameInput).toHaveValue('My Staking Contract');
  });

  it('should display `Description` field as required (including sub info) and able to fill the `Description` field', async () => {
    render(<CreateStakingContract />);

    const descriptionInput = screen.getByLabelText('Description');
    expect(descriptionInput).toBeRequired();

    expect(
      screen.getByText(
        /Good descriptions help governors understand the value your contract brings to the ecosystem. Be clear to increase the chance governors allocate rewards to your contract./,
      ),
    ).toBeInTheDocument();

    await userEvent.type(descriptionInput, 'This is a staking contract');
    expect(descriptionInput).toHaveValue('This is a staking contract');
  });

  it('should display `Template` field with the default template', () => {
    render(<CreateStakingContract />);

    expect(screen.getByText('Template')).toBeInTheDocument();
    expect(screen.getByText('More templates coming soon')).toBeInTheDocument();
    expect(screen.getByText('Staking Token')).toBeInTheDocument();
    expect(
      screen.getByText(
        /This template contract is for staking a service by its owner when the service has an ERC20 token as the deposit/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('View template on explorer ↗')).toBeInTheDocument();
  });

  it('should display `Maximum number of staked agents` field as required and able to fill the field', async () => {
    render(<CreateStakingContract />);

    const maxNumServicesInput = screen.getByLabelText('Maximum number of staked agents');
    expect(maxNumServicesInput).toBeRequired();

    await userEvent.type(maxNumServicesInput, '10');
    expect(maxNumServicesInput).toHaveValue('10');
  });

  it('should display `Rewards, OLAS per second` field as required and able to fill the `Rewards, OLAS per second` field', async () => {
    render(<CreateStakingContract />);

    const rewardsPerSecondInput = screen.getByLabelText('Rewards, OLAS per second');
    expect(rewardsPerSecondInput).toBeRequired();

    await userEvent.type(rewardsPerSecondInput, '100');
    expect(rewardsPerSecondInput).toHaveValue('100');
  });

  it('should display cancel & create contract button', () => {
    render(<CreateStakingContract />);

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create contract' })).toBeInTheDocument();
  });
});
