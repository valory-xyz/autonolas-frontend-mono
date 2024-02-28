
import { render } from "@testing-library/react";
import { YellowButton } from "../../common-util/YellowButton";
import '@testing-library/jest-dom';

describe('YellowButton', () => {
  it('should render a yellow button', () => {
    const { getByText } = render(<YellowButton>Button</YellowButton>);
    expect(getByText('Button')).toBeInTheDocument();
  });
});
