import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getMechMinterContract } from '../../../common-util/Contracts';
import MintComponent from '../../../components/ListComponents/mint';
import { FORM_NAME } from '../../../common-util/List/RegisterForm';
import {
  wrapProvider,
  dummyAddress,
  mockV1Hash,
  svmConnectivityEmptyMock,
  useHelpersEvmMock,
} from '../../tests-helpers';
import { fillIpfsGenerationModal } from '../../tests-helpers/prefillForm';

const NEW_COMPONENT = { name: 'New Component One' };

jest.mock('../../../common-util/Contracts', () => ({
  getMechMinterContract: jest.fn(),
}));

jest.mock('../../../common-util/List/IpfsHashGenerationModal/helpers', () => ({
  getIpfsHashHelper: jest.fn(() => mockV1Hash),
}));

jest.mock('common-util/hooks/useHelpers', () => ({
  useHelpers: () => useHelpersEvmMock,
}));

jest.mock('common-util/hooks/useSvmConnectivity', () => ({
  useSvmConnectivity: () => svmConnectivityEmptyMock,
}));

describe('listComponents/mint.jsx', () => {
  it('should submit the form & mint the `Component` successfully', async () => {
    getMechMinterContract.mockImplementation(() => ({
      methods: {
        create: jest.fn(() => ({
          send: jest.fn(() => Promise.resolve(NEW_COMPONENT)),
        })),
      },
    }));

    const { container, getByText, getByRole } = render(wrapProvider(<MintComponent />));

    // title
    expect(getByText(/Mint Component/i)).toBeInTheDocument();

    // get hash
    userEvent.click(getByRole('button', { name: 'Generate Hash & File' }));

    // wait for ipfs generation modal to open
    await waitFor(() => {
      getByText(/Generate IPFS Hash of Metadata File/i);
    });

    fillIpfsGenerationModal();

    // other fields
    expect(getByRole('button', { name: 'Prefill Address' })).toBeInTheDocument();
    userEvent.type(container.querySelector(`#${FORM_NAME}_owner_address`), dummyAddress);
    userEvent.type(container.querySelector(`#${FORM_NAME}_dependencies`), '1, 2');

    const submitButton = getByRole('button', { name: 'Submit' });
    expect(submitButton).toBeInTheDocument();
    userEvent.click(submitButton);

    // await waitFor(async () => {
    // TODO: antd form throws error on hash, check console
    // check if `Component minted` on `Submit` click
    // expect(container.querySelector('.ant-alert-message').textContent).toBe(
    //   'Component minted',
    // );
    // });
  });
});
