import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

// import userEvent from '@testing-library/user-event';
import { List } from './List';

jest.mock('store/index', () => ({
  useAppSelector: jest.fn().mockReturnValue({
    myStakingContracts: [
      {
        id: '0x1234',
        chainId: 1,
        name: 'Iron man',
        description: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
        template: 'Staking Token',
        isNominated: false,
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

    // expect(rows).toHaveLength(2);

    // const [firstRow, secondRow] = rows;

    // expect(firstRow).toHaveTextContent('Staking Contract Name 1');
    // expect(firstRow).toHaveTextContent('Some good contract description.');
    // expect(firstRow).toHaveTextContent('Nominated');

    // expect(secondRow).toHaveTextContent('Another Contract Name');
    // expect(secondRow).toHaveTextContent('Another contract description.');
    // expect(secondRow).toHaveTextContent('Nominate');
  });

  // it('should navigate to the nominated contract', () => {
  //   render(<List />);

  //   const nominateButton = screen.getByRole('button', { name: /nominate/i });

  //   userEvent.click(nominateButton);

  //   expect(window.location.pathname).toBe(
  //     '/nominate/0x0000000000000000000000007248d855a3d4d17c32eb0d996a528f7520d2f4a3',
  //   );
  // });
});
