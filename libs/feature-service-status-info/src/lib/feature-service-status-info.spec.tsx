import { render } from '@testing-library/react';

import FeatureServiceStatusInfo from './feature-service-status-info';

describe('FeatureServiceStatusInfo', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<FeatureServiceStatusInfo />);
    expect(baseElement).toBeTruthy();
  });
});
