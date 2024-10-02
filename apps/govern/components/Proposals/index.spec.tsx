import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { ProposalsPage } from './index';

jest.mock('./ProposalsList', () => ({
  ProposalsList: () => <div>Proposals List</div>,
}));

describe('<Proposals />', () => {
  it('should display the page title and description', () => {
    render(<ProposalsPage />);
    const pageTitle = screen.getByText('On-chain proposals');
    expect(pageTitle).toBeInTheDocument();

    const pageDesc = screen.getByText(
      /Participate in Autonolas DAO governance by voting on on-chain proposals./,
    );
    expect(pageDesc).toBeInTheDocument();
  });
});
