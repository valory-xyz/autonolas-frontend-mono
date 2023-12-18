import { render } from '@testing-library/react';

import MyNextHeader from './my-next-header';

describe('MyNextHeader', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<MyNextHeader />);
    expect(baseElement).toBeTruthy();
  });
});
