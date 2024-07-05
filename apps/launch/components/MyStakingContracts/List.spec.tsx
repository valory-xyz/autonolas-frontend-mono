import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';

// import userEvent from '@testing-library/user-event';
import { List } from './List';

jest.mock('store/index', () => ({
  useAppSelector: jest.fn().mockReturnValue({
    myStakingContracts: [
      {
        id: '0x1111',
        chainId: 1,
        name: 'My contract one',
        description: 'Some good description one',
        template: 'Staking Token',
        isNominated: false,
      },
      {
        id: '0x2222',
        chainId: 1,
        name: 'My contract two',
        description: 'Some good description two',
        template: 'Staking Token',
        isNominated: true,
      },
    ],
  }),
}));

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

    const firstRow = screen.getByText('My contract one').closest('tr');

    if (!firstRow) throw new Error('No row found');

    expect(within(firstRow).getByText('My contract one')).toBeInTheDocument();
    expect(within(firstRow).getByText('Some good description one')).toBeInTheDocument();
    expect(within(firstRow).getByText('Staking Token')).toBeInTheDocument();
  });

  it('should display nominate button if the staking contract is NOT nominated', () => {
    render(<List />);

    const yetToNominateBtn = screen.getByText('My contract one').closest('tr');

    if (!yetToNominateBtn) throw new Error('No row found');

    const nominateBtn = within(yetToNominateBtn).getByText('Nominate').closest('button');
    expect(nominateBtn).toBeEnabled();
  });

  it('should display nominated text if the staking contract is nominated', () => {
    render(<List />);

    const nominatedRow = screen.getByText('My contract two').closest('tr');

    if (!nominatedRow) throw new Error('No row found');

    const nominateBtn = within(nominatedRow).getByText('Nominated');
    expect(nominateBtn).toBeInTheDocument();
  });
});
