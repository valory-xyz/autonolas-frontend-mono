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
  useTimeForEmissionsLimit: jest.fn().mockReturnValue({ data: 2592000 }),
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

const clickCreateContractButton = async () => {
  const createContractBtn = screen.getByRole('button', { name: 'Create contract' });
  await userEvent.click(createContractBtn);
};

describe('<CreateStakingContract />', () => {
  it('should display title of the staking contract form', () => {
    render(<CreateStakingContract />);

    expect(screen.getByText(/Create staking contract on Ethereum/i)).toBeInTheDocument();
  });

  // Name
  it('should display `Name` field as required and able to fill the `Name` field', async () => {
    render(<CreateStakingContract />);

    const nameInput = screen.getByLabelText('Name');
    expect(nameInput).toBeRequired();

    await userEvent.type(nameInput, 'My Staking Contract');
    expect(nameInput).toHaveValue('My Staking Contract');
  });

  // Description
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

  // Template
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

  // Maximum number of staked agents
  it('should display `Maximum number of staked agents` field as required, able to fill and see the error message when the value is out of range', async () => {
    render(<CreateStakingContract />);

    const maxNumServicesInput = screen.getByLabelText('Maximum number of staked agents');
    expect(maxNumServicesInput).toBeRequired();

    await userEvent.type(maxNumServicesInput, '100000000');
    expect(maxNumServicesInput).toHaveValue('100000000');

    await clickCreateContractButton();
    expect(
      screen.getByText('Maximum number of staked agents must be at least 1 and at most 100'),
    ).toBeInTheDocument();
  });

  // Rewards, OLAS per second
  it('should display `Rewards, OLAS per second` field as required, able to fill and see the error message when the value is out of range', async () => {
    render(<CreateStakingContract />);

    const rewardsPerSecondInput = screen.getByLabelText('Rewards, OLAS per second');
    expect(rewardsPerSecondInput).toBeRequired();

    await userEvent.type(rewardsPerSecondInput, '100');
    expect(rewardsPerSecondInput).toHaveValue('100');

    await clickCreateContractButton();
    expect(
      screen.getByText('The rewards per second must be below the allowed limit'),
    ).toBeInTheDocument();
  });

  // Minimum service staking deposit, OLAS
  it('should display `Minimum service staking deposit, OLAS` field as required, able to fill and see the error message when the value is out of range', async () => {
    render(<CreateStakingContract />);

    const minStakingDepositInput = screen.getByLabelText('Minimum service staking deposit, OLAS');
    expect(minStakingDepositInput).toBeRequired();

    expect(minStakingDepositInput).toHaveValue('10'); // default value

    await userEvent.clear(minStakingDepositInput);
    await userEvent.type(minStakingDepositInput, '1000000');

    await clickCreateContractButton();
    expect(
      screen.getByText('Minimum service staking deposit, OLAS must be at least 1 and at most 1000'),
    ).toBeInTheDocument();
  });

  // Minimum number of staking periods
  it('should display `Minimum number of staking periods` field as required and able to fill the field', async () => {
    render(<CreateStakingContract />);

    const minStakingPeriodsInput = screen.getByLabelText('Minimum number of staking periods');
    expect(minStakingPeriodsInput).toBeRequired();

    expect(minStakingPeriodsInput).toHaveValue('3'); // default value
  });

  // Maximum number of inactivity periods
  it('should display `Maximum number of inactivity periods` field as required and able to fill the field', async () => {
    render(<CreateStakingContract />);

    const maxInactivityPeriodsInput = screen.getByLabelText('Maximum number of inactivity periods');
    expect(maxInactivityPeriodsInput).toBeRequired();

    expect(maxInactivityPeriodsInput).toHaveValue('2'); // default value
  });

  // Liveness period
  it('should display `Liveness period` field as required and able to fill the field', async () => {
    render(<CreateStakingContract />);

    const livenessPeriodInput = screen.getByLabelText('Liveness period');
    expect(livenessPeriodInput).toBeRequired();

    expect(livenessPeriodInput).toHaveValue('86400'); // default value
  });

  // Time for emissions
  it('should display `Time for emissions` field as required, able to fill and see the error message when the value is out of range', async () => {
    render(<CreateStakingContract />);

    const timeForEmissionsInput = screen.getByLabelText('Time for emissions');
    expect(timeForEmissionsInput).toBeRequired();

    expect(timeForEmissionsInput).toHaveValue('2592000'); // default value

    // clear the field & add more than the allowed limit
    await userEvent.clear(timeForEmissionsInput);
    await userEvent.type(timeForEmissionsInput, '100000000');

    await clickCreateContractButton();
    expect(
      screen.getByText('Time for emissions must be between 1 and 2592000 seconds'),
    ).toBeInTheDocument();
  });

  // Number of agent instances
  it('should display `Number of agent instances` field as required and able to fill the field', async () => {
    render(<CreateStakingContract />);

    const numAgentInstancesInput = screen.getByLabelText('Number of agent instances');
    expect(numAgentInstancesInput).toBeRequired();

    expect(numAgentInstancesInput).toHaveValue('1'); // default value
  });

  // Agent IDs
  it('should display `Agent IDs` field as required and able to fill the field', async () => {
    render(<CreateStakingContract />);

    const agentIdsInput = screen.getByLabelText('Agent IDs');
    expect(agentIdsInput).toBeRequired();

    await userEvent.clear(agentIdsInput);
    await userEvent.type(agentIdsInput, '1,2,    ');

    await clickCreateContractButton();
    expect(
      screen.getByText('Please input a valid list of numbers separated by commas.'),
    ).toBeInTheDocument();
  });

  // Multisig threshold
  it('should display `Multisig threshold` field as required and able to fill the field', async () => {
    render(<CreateStakingContract />);

    const multisigThresholdInput = screen.getByLabelText('Multisig threshold');
    expect(multisigThresholdInput).not.toBeRequired();

    expect(multisigThresholdInput).toHaveValue('0'); // default value
  });

  // Service configuration hash
  it('should display `Service configuration hash` field as required and able to fill the field', async () => {
    render(<CreateStakingContract />);

    const serviceConfigHashInput = screen.getByLabelText('Service configuration hash');
    expect(serviceConfigHashInput).not.toBeRequired();

    expect(serviceConfigHashInput).toHaveValue(
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    ); // default value
  });

  // Activity checker address
  it('should display `Activity checker address` field as required and able to fill the field', async () => {
    render(<CreateStakingContract />);

    const activityCheckerAddressInput = screen.getByLabelText('Activity checker address');
    expect(activityCheckerAddressInput).toBeRequired();

    await userEvent.type(activityCheckerAddressInput, '0x12345');

    await clickCreateContractButton();
    expect(screen.getByText('Please input a valid address')).toBeInTheDocument();
  });

  it('should display cancel & create contract button', () => {
    render(<CreateStakingContract />);

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create contract' })).toBeInTheDocument();
  });
});
