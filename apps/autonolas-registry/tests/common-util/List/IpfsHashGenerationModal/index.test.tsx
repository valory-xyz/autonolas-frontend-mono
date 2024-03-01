import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { IpfsHashGenerationModal } from '../../../../common-util/List/IpfsHashGenerationModal';
import { wrapProvider, mockV1Hash } from '../../../helpers';

jest.mock(
  '../../../../common-util/List/IpfsHashGenerationModal/helpers',
  () => ({
    getIpfsHashHelper: jest.fn(() => mockV1Hash),
  }),
);

const callbackMock = jest.fn();
const handleCancelMock = jest.fn();

describe('<IpfsHashGenerationModal />', () => {
  it('should render a hash generation modal and', async () => {
    const { getByText } = render(
      wrapProvider(
        <IpfsHashGenerationModal
          visible
          type="agent"
          callback={callbackMock}
          handleCancel={handleCancelMock}
        />,
        true,
      ),
    );

    expect(
      getByText('Generate IPFS Hash of Metadata File'),
    ).toBeInTheDocument();
  });
});
