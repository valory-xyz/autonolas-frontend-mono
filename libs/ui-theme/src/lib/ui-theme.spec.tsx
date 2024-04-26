import React from 'react';
import { render } from '@testing-library/react';

import { AutonolasThemeProvider } from './ThemeConfig';

describe('UiTheme', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<AutonolasThemeProvider  />);
    expect(baseElement).toBeTruthy();
  });
});
