import { render } from '@testing-library/react';
import React from 'react';

import Index from '../pages/index';

// The page's cards call useRouter; there is no router outside Next, so stand one in.
jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn(), pathname: '/', query: {} }),
}));

describe('Index', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<Index />);
    expect(baseElement).toBeTruthy();
  });
});
