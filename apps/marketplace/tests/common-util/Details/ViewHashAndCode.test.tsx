import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import { ViewHashAndCode } from 'common-util/Details/DetailsSubInfo/ViewHashAndCode';
import { HASH_DETAILS_STATE, NAV_TYPES } from 'util/constants';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('ViewHashAndCode', () => {
  const baseProps = {
    type: NAV_TYPES.AI_AGENTS,
    metadataLoadState: HASH_DETAILS_STATE.LOADED,
    hashUrl: 'https://gateway.example/metadata.json',
    chainId: null,
    serviceId: null,
  };

  it('omits the View Code link when metadata has no code URL', () => {
    render(<ViewHashAndCode {...baseProps} codeHref={null} />);

    expect(screen.getByRole('link', { name: /View Hash/ }).getAttribute('href')).toBe(
      baseProps.hashUrl,
    );
    expect(screen.queryByRole('link', { name: /View Code/ })).toBeNull();
  });

  it('renders the View Code link when metadata includes a code URL', () => {
    const codeUrl = 'https://gateway.example/agent.wasm';
    render(<ViewHashAndCode {...baseProps} codeHref={codeUrl} />);

    expect(screen.getByRole('link', { name: /View Code/ }).getAttribute('href')).toBe(codeUrl);
  });
});
