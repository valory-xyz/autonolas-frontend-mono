import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { YellowButton } from '../../common-util/YellowButton';

describe('YellowButton', () => {
  it('should render a yellow button', () => {
    const { getByText } = render(<YellowButton>Button</YellowButton>);
    expect(getByText('Button')).toBeInTheDocument();
  });
});
