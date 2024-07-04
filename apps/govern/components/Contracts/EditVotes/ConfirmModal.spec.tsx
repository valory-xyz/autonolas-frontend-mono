import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FC } from 'react';

import { ConfirmModal } from './ConfirmModal';

const EditVotesExample: FC<{
  handleOk?: () => void;
  handleClose?: () => void;
}> = ({ handleOk, handleClose }) => {
  return (
    <ConfirmModal
      isOpen
      handleOk={handleOk || jest.fn()}
      handleClose={handleClose || jest.fn()}
      isLoading={false}
      allocationsLength={2}
      allocatedPower={1100}
    />
  );
};

describe('<ConfirmModal/>', () => {
  it('should display confirm modal details', () => {
    render(<EditVotesExample />);

    expect(screen.getByText(/Confirm voting weight update/)).toBeInTheDocument();
    expect(
      screen.getByText(/You're allocating 11% of your voting power to 2 staking contracts./),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /After you confirm, you'll enter a 10 day cooldown period. You won't be able to update your weights during that time./,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /89% of your voting power is unallocated - this will be applied to the Rollover Pool and may be used in future epochs./,
      ),
    ).toBeInTheDocument();
  });

  it('should be able to close modal', async () => {
    const handleClose = jest.fn();
    render(<EditVotesExample handleClose={handleClose} />);

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    if (!cancelButton) throw new Error('Cancel button not found');

    await userEvent.click(cancelButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should be able to confirm modal', async () => {
    const handleOk = jest.fn();
    render(<EditVotesExample handleOk={handleOk} />);

    const confirmButton = screen.getByRole('button', { name: 'Confirm voting weight' });
    if (!confirmButton) throw new Error('Confirm button not found');

    await userEvent.click(confirmButton);

    expect(handleOk).toHaveBeenCalledTimes(1);
  });
});
