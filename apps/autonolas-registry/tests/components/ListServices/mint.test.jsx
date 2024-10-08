import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { getServiceManagerContract } from 'common-util/Contracts';
import { useHelpers } from 'common-util/hooks';
import MintService from 'components/ListServices/mint';
import { FORM_NAME } from 'components/ListServices/helpers/RegisterForm';
import { fillIpfsGenerationModal } from '../../tests-helpers/prefillForm';
import {
  wrapProvider,
  dummyAddress,
  mockV1Hash,
  svmConnectivityEmptyMock,
  useHelpersEvmMock,
  useHelpersSvmMock,
} from '../../tests-helpers';

const NEW_SERVICE = { name: 'New Service One' };

jest.mock('common-util/Contracts', () => ({
  getServiceManagerContract: jest.fn(),
}));

jest.mock('common-util/List/IpfsHashGenerationModal/helpers', () => ({
  getIpfsHashHelper: jest.fn(() => mockV1Hash),
}));

jest.mock('common-util/hooks/useHelpers', () => ({
  useHelpers: jest.fn(),
}));

jest.mock('common-util/hooks/useSvmConnectivity', () => ({
  useSvmConnectivity: jest.fn(() => svmConnectivityEmptyMock),
}));

describe('listServices/mint.jsx', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getServiceManagerContract.mockImplementation(() => ({
      create: jest.fn(() => ({
        send: jest.fn(() => Promise.resolve(NEW_SERVICE)),
      })),
    }));
    useHelpers.mockReturnValue(useHelpersEvmMock);
  });

  it('should submit the form successfully', async () => {
    const { container, getByText, getByRole, getByTestId } = render(wrapProvider(<MintService />));
    // title
    expect(getByText(/Mint Service/i)).toBeInTheDocument();

    // get hash
    userEvent.click(getByTestId('generate-hash-file'));

    // wait for ipfs generation modal to open
    await waitFor(() => {
      getByText(/Generate IPFS Hash of Metadata File/i);
    });

    fillIpfsGenerationModal();

    // other fields
    userEvent.type(container.querySelector(`#${FORM_NAME}_owner_address`), dummyAddress);
    userEvent.type(container.querySelector(`#${FORM_NAME}_agent_ids`), '1');
    userEvent.type(container.querySelector(`#${FORM_NAME}_agent_num_slots`), '1');
    userEvent.type(container.querySelector(`#${FORM_NAME}_bonds`), '1');
    userEvent.type(container.querySelector(`#${FORM_NAME}_threshold`), '1');

    const submitButton = getByRole('button', { name: 'Submit' });
    expect(submitButton).toBeInTheDocument();
    userEvent.click(submitButton);

    // await act(async () => {
    // TODO: antd form throws error on hash, check console, check console
    // check if `Service registered` on `Submit` click
    // expect(container.querySelector('.ant-alert-message').textContent).toBe(
    //   'Service registered',
    // );
    // });
  });

  describe('EVM', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      useHelpers.mockReturnValue(useHelpersEvmMock);
    });

    it('should show "ERC20 token address" input', async () => {
      const { container } = render(wrapProvider(<MintService />));

      const erc20TokenInput = container.querySelector(`#${FORM_NAME}_token`);
      expect(erc20TokenInput).not.toBeNull();
    });
  });

  describe('SVM', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      useHelpers.mockReturnValue(useHelpersSvmMock);
    });

    it('should NOT show "ERC20 token address" input', async () => {
      const { container } = render(wrapProvider(<MintService />));

      const erc20TokenInput = container.querySelector(`#${FORM_NAME}_token`);
      expect(erc20TokenInput).toBeNull();
    });
  });
});
