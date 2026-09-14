import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import type { ListedUnit } from 'common-util/functions/fetchListings';

import { ListingSummary } from './index';

const UNITS: ListedUnit[] = [
  {
    id: '0x1',
    publicId: 'valory/prediction_agent',
    description: 'Answers questions about future events.',
    serviceId: '42',
  },
  { id: '0x2', publicId: 'valory/mech', description: 'A tool marketplace agent.', tokenId: '7' },
];

/**
 * Guards the Phase 2 contract for the marketplace listings. The visible table is client-only, so
 * without this block the page served 38 characters — its title and nothing else.
 */
describe('ListingSummary pre-rendered listing', () => {
  it('names every unit it was given', () => {
    render(<ListingSummary units={UNITS} label="AI agents" snapshotGeneratedAt={null} />);

    expect(screen.getByText('valory/prediction_agent')).toBeInTheDocument();
    expect(screen.getByText('valory/mech')).toBeInTheDocument();
    expect(screen.getByText(/Answers questions about future events/)).toBeInTheDocument();
  });

  it('says how many rows it lists and what they are', () => {
    render(<ListingSummary units={UNITS} label="AI agents" snapshotGeneratedAt={null} />);

    expect(screen.getByText(/2 most recently registered AI agents/)).toBeInTheDocument();
  });

  it('states when the snapshot was taken, when it has one', () => {
    render(
      <ListingSummary
        units={UNITS}
        label="AI agents"
        snapshotGeneratedAt="2026-09-08T14:33:00.000Z"
      />,
    );

    expect(screen.getByText(/snapshot taken 8 Sep 2026, 14:33 UTC/)).toBeInTheDocument();
  });

  // The rows are the same on every network page, so claiming a network would be false on seven
  // of the eight. See apps/marketplace/CLAUDE.md.
  it('makes no claim about which network the rows belong to', () => {
    const { container } = render(
      <ListingSummary units={UNITS} label="AI agents" snapshotGeneratedAt={null} />,
    );

    expect(container.textContent).not.toMatch(/\bon (Base|Gnosis|Ethereum|Polygon)\b/);
  });

  it('renders nothing rather than an empty list when the fetch came back empty', () => {
    const { container } = render(
      <ListingSummary units={[]} label="AI agents" snapshotGeneratedAt={null} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
