import '@testing-library/jest-dom';
import { render } from '@testing-library/react';

import { YellowButton } from './SwitchNetworkButton';

describe('YellowButton', () => {
  it('should display a yellow button', () => {
    const { getByText } = render(<YellowButton>Button</YellowButton>);
    expect(getByText('Button')).toBeInTheDocument();
  });
});
