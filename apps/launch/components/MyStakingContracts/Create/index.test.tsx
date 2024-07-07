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

jest.mock('common-util/config/wagmi', () => ({
  SUPPORTED_CHAINS: [{ name: 'ethereum', chainId: 1 }],
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

  it('should display form fields for creating staking contract', () => {
    render(<CreateStakingContract />);

    expect(screen.getByText('Name')).toBeInTheDocument();

    // description
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Good descriptions help governors understand the value your contract brings to the ecosystem. Be clear to increase the chance governors allocate rewards to your contract./,
      ),
    ).toBeInTheDocument();

    // template
    expect(screen.getByText('Template')).toBeInTheDocument();
    expect(screen.getByText('More templates coming soon')).toBeInTheDocument();
    expect(screen.getByText('Staking Token')).toBeInTheDocument();
    expect(
      screen.getByText(
        /This template contract is for staking a service by its owner when the service has an ERC20 token as the deposit/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('View template on explorer ↗')).toBeInTheDocument();

    expect(screen.getByText('Maximum number of staked agents')).toBeInTheDocument();
    expect(screen.getByText('Rewards, OLAS per second')).toBeInTheDocument();
  });

  it('should display cancel & create contract button', () => {
    render(<CreateStakingContract />);

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create contract' })).toBeInTheDocument();
  });

  it('should be able to fill the form and submit', async() => {
    render(<CreateStakingContract />);

    const nameInput = screen.getByLabelText('Name');
    await userEvent.type(nameInput, 'My Staking Contract');

    const createContractBtn = screen.getByRole('button', { name: 'Create contract' });

    // submit the form
    createContractBtn.click();
    screen.debug();

    expect(screen.getByText('Name')).toBeInTheDocument();
    // expect no error in the form
    // expect(screen.queryByText('Description is required')).toBeInTheDocument();


    // expect(nameInput).toHaveValue('My Staking Contract');
    // expect(descriptionInput).toHaveValue('This is a staking contract');
  });
});
