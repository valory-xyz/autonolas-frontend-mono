import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { List } from '.';

jest.mock('store/index', () => ({
  useAppSelector: jest.fn().mockReturnValue({ networkName: 'ethereum' }),
}));

const mockRefetchNominees = jest.fn();
jest.mock('hooks/useNominees', () => ({
  useNominees: () => ({ refetch: mockRefetchNominees, isFetching: false }),
}));
jest.mock('hooks/useMyStakingContracts', () => ({
  useMyStakingContracts: () => ({
    isMyStakingContractsLoading: false,
    myStakingContracts: [
      {
        id: '0x1111',
        chainId: 1,
        name: 'My contract one',
        description: 'Some good description one',
        template: 'Staking Token',
        nominationStatus: 'notNominated',
      },
      {
        id: '0x2222',
        chainId: 1,
        name: 'My contract two',
        description: 'Some good description two',
        template: 'Staking Token',
        nominationStatus: 'nominated',
      },
      {
        id: '0x3333',
        chainId: 1,
        name: 'My contract three',
        description: 'Some good description three',
        template: 'Staking Token',
        nominationStatus: 'unknown',
      },
      {
        id: '0x4444',
        chainId: 1,
        name: 'My contract four',
        description: 'Some good description four',
        template: 'Staking Token',
        nominationStatus: 'loading',
      },
    ],
  }),
}));

const rowOf = (name: string) => {
  const row = screen.getByText(name).closest('tr');
  if (!row) throw new Error('No row found');
  return row;
};

describe('<List />', () => {
  it('should display column name of my staking contracts table', () => {
    render(<List />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Template')).toBeInTheDocument();
    expect(screen.getByText('Nominated for incentives?')).toBeInTheDocument();
  });

  it('should display my staking contracts', () => {
    render(<List />);

    const firstRow = rowOf('My contract one');

    expect(within(firstRow).getByText('My contract one')).toBeInTheDocument();
    expect(within(firstRow).getByText('My contract one')).toHaveAttribute(
      'href',
      '/ethereum/my-staking-contracts/0x1111',
    );
    expect(within(firstRow).getByText('Some good description one')).toBeInTheDocument();
    expect(within(firstRow).getByText('Staking Token')).toBeInTheDocument();
  });

  it('should display nominate button if the staking contract is NOT nominated', () => {
    render(<List />);

    const nominateBtn = within(rowOf('My contract one')).getByText('Nominate').closest('button');
    expect(nominateBtn).toBeEnabled();
  });

  it('should display nominated text if the staking contract is nominated', () => {
    render(<List />);

    expect(within(rowOf('My contract two')).getByText('Nominated')).toBeInTheDocument();
  });

  it('offers no Nominate action when the nomination status is unknown, only a retry', async () => {
    render(<List />);

    const row = rowOf('My contract three');
    expect(within(row).queryByText('Nominate')).not.toBeInTheDocument();
    expect(within(row).getByText('Status unavailable')).toBeInTheDocument();

    await userEvent.click(within(row).getByRole('button', { name: /Retry/ }));
    expect(mockRefetchNominees).toHaveBeenCalled();
  });

  it('offers no Nominate action while the nomination status is loading', () => {
    render(<List />);

    const row = rowOf('My contract four');
    expect(within(row).queryByText('Nominate')).not.toBeInTheDocument();
    expect(within(row).getByTestId('nomination-status-loading')).toBeInTheDocument();
  });

  it('counts only contracts known not to be nominated', () => {
    render(<List />);

    expect(
      screen.getByText("1 contract hasn't been nominated to receive staking incentives"),
    ).toBeInTheDocument();
  });
});
