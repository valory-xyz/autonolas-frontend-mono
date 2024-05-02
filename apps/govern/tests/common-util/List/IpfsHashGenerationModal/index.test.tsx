import '@testing-library/jest-dom';
import { render } from '@testing-library/react';

import { IpfsHashGenerationModal } from '../../../../common-util/List/IpfsHashGenerationModal';
import { wrapProvider, mockV1Hash } from '../../../tests-helpers';

jest.mock(
  '../../../../common-util/List/IpfsHashGenerationModal/helpers',
  () => ({
    getIpfsHashHelper: jest.fn(() => mockV1Hash),
  }),
);

jest.mock('../../../../common-util/hooks', () => ({
  useHelpers: jest.fn(() => ({ isConnectedToWrongNetwork: false })),
  useSvmConnectivity: jest.fn(),
}));

const callbackMock = jest.fn();
const handleCancelMock = jest.fn();

describe('<IpfsHashGenerationModal />', () => {
  it('should display a hash generation modal and', async () => {
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
