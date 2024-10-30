import { render } from '@testing-library/react';
import React from 'react';

import { AutonolasThemeProvider } from './ThemeConfig';

describe('<AutonolasThemeProvider />', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<AutonolasThemeProvider />);
    expect(baseElement).toBeTruthy();
  });
});
