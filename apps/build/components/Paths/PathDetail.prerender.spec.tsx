import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import paths from 'components/Paths/data.json';

// Lives here rather than beside the page: Next builds every .tsx under pages/ as a route.
import PathDetailPage from '../../pages/paths/[id]';

const GUIDE = '1. Build a tool that answers a question.\n1. Submit it to the Mechs marketplace.';

const withService = paths.find((path) => path.service)!;
const withoutService = paths.find((path) => !path.service)!;

/**
 * Guards the Phase 2 contract for these pages. Each used to serve 471-476 characters — nav,
 * footer and a title — because `loading` started `true` and only cleared from an effect, so a
 * server render always took the spinner branch. Everything asserted here must come from props.
 */
describe('build path detail pre-render', () => {
  it('renders the guide body rather than a spinner', () => {
    render(<PathDetailPage pathData={withService} markdownContent={GUIDE} />);

    expect(screen.getByText(/Build a tool that answers a question/)).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /loading/i })).not.toBeInTheDocument();
  });

  it('renders the sections that never needed a browser', () => {
    render(<PathDetailPage pathData={withService} markdownContent={GUIDE} />);

    expect(screen.getByRole('heading', { name: withService.name })).toBeInTheDocument();
    expect(screen.getByText(withService.description)).toBeInTheDocument();
    expect(screen.getByText(/eligible for Build Rewards/)).toBeInTheDocument();
    expect(screen.getByText(/This tool contributes to the/)).toBeInTheDocument();
  });

  it('omits the service section for a path that has none', () => {
    render(<PathDetailPage pathData={withoutService} markdownContent={GUIDE} />);

    expect(screen.getByText(/eligible for Build Rewards/)).toBeInTheDocument();
    expect(screen.queryByText(/This tool contributes to the/)).not.toBeInTheDocument();
  });

  it('does not depend on the router', () => {
    // No router mock is installed; the page used to read its id from `router.query`.
    expect(() =>
      render(<PathDetailPage pathData={withService} markdownContent={GUIDE} />),
    ).not.toThrow();
  });
});
