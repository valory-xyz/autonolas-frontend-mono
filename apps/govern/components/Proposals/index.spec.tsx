import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { ProposalsPage } from './index';

describe('<Proposals />', () => {
  it('should display the page title and description', () => {
    render(<ProposalsPage />);
    const pageTitle = screen.getByText('Proposals');
    expect(pageTitle).toBeInTheDocument();

    const pageDesc = screen.getByText(
      /Participate in the Autonolas DAO governance by voting on proposals./,
    );
    expect(pageDesc).toBeInTheDocument();
  });
});
