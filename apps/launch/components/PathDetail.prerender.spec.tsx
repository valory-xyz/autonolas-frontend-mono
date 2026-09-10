import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { PATHS } from 'common-util/constants/paths';

import { PathDetailPage } from './PathDetail';

const GUIDE = `1. Identify a market need that can be served by an autonomous service.
1. [Pick a service development kit](https://olas.network/#kits) that helps you serve it.`;

/**
 * Guards the Phase 2 contract for this page. Both paths used to serve the same 105-character
 * shell: the guide was fetched from the browser and the path came from `router.query`, which is
 * empty during a pre-render. Everything here must come from props alone.
 */
describe('PathDetailPage pre-rendered guide', () => {
  const path = PATHS[0];

  it('renders the guide body, not just the chrome', () => {
    render(<PathDetailPage path={path} markdown={GUIDE} />);

    expect(screen.getByText(/Identify a market need/)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Pick a service development kit/ }),
    ).toBeInTheDocument();
  });

  it('names the path it is describing', () => {
    render(<PathDetailPage path={path} markdown={GUIDE} />);

    expect(screen.getByRole('heading', { name: path.name })).toBeInTheDocument();
    expect(screen.getByText(path.description)).toBeInTheDocument();
  });

  // The two paths must be distinguishable to a reader who fetches each once.
  it('renders different content for each path', () => {
    const { unmount } = render(<PathDetailPage path={PATHS[0]} markdown="First guide body." />);
    expect(screen.getByText('First guide body.')).toBeInTheDocument();
    unmount();

    render(<PathDetailPage path={PATHS[1]} markdown="Second guide body." />);
    expect(screen.getByText('Second guide body.')).toBeInTheDocument();
    expect(screen.queryByText('First guide body.')).not.toBeInTheDocument();
  });

  it('does not depend on the router', () => {
    // No router mock is installed. If the component reaches for `router.query` again, this throws.
    expect(() => render(<PathDetailPage path={path} markdown={GUIDE} />)).not.toThrow();
  });
});
