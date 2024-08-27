import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { UNICODE_SYMBOLS } from 'libs/util-constants/src';

import { ProposalsPage, proposals } from './index';

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

  it.each(proposals)('should display all details for $title proposal', (proposal) => {
    render(<ProposalsPage />);
    const proposalTitle = screen.getByText(proposal.title);
    expect(proposalTitle).toBeInTheDocument();

    const proposalDesc = screen.getByText(proposal.description);
    expect(proposalDesc).toBeInTheDocument();

    const proposalImage = screen.getByAltText(proposal.title);
    expect(proposalImage).toBeInTheDocument();

    const btnName = `${proposal.button.title} ${UNICODE_SYMBOLS.EXTERNAL_LINK}`;
    const proposalButton = screen.getByText(btnName);
    expect(proposalButton).toBeInTheDocument();
    expect(proposalButton.parentElement).toHaveAttribute('href', proposal.button.href);
  });
});
