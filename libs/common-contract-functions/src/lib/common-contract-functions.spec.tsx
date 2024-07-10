import { render } from '@testing-library/react';

import CommonContractFunctions from './common-contract-functions';

describe('CommonContractFunctions', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<CommonContractFunctions />);
    expect(baseElement).toBeTruthy();
  });
});
