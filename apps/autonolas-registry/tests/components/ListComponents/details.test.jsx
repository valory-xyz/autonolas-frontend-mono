import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Component from 'components/ListComponents/details';
import {
  getComponentDetails,
  getComponentHashes,
  getComponentOwner,
  getTokenUri,
} from 'components/ListComponents/utils';
import { GATEWAY_URL } from 'util/constants';

import {
  dummyAddress,
  mockCodeUri,
  mockIpfs,
  mockNftImageHash,
  mockV1Hash,
  svmConnectivityEmptyMock,
  useHelpersEvmMock,
  wrapProvider,
} from '../../tests-helpers';

jest.mock('next/router', () => ({
  __esModule: true,
  useRouter() {
    return { query: { id: '1' } };
  },
}));

jest.mock('wagmi', () => ({
  __esModule: true,
  useEnsName() {
    return { data: 'ENS Value' };
  },
}));

jest.mock('common-util/List/IpfsHashGenerationModal/helpers', () => ({
  getIpfsHashHelper: jest.fn(() => mockV1Hash),
}));

jest.mock('common-util/Details/utils', () => ({
  checkIfServiceRequiresWhitelisting: jest.fn(() => false),
}));

jest.mock('components/ListComponents/utils', () => ({
  getComponentDetails: jest.fn(),
  getComponentHashes: jest.fn(),
  getComponentOwner: jest.fn(),
  getTokenUri: jest.fn(),
}));

jest.mock('common-util/hooks/useHelpers', () => ({
  useHelpers: () => useHelpersEvmMock,
}));

jest.mock('common-util/hooks/useSvmConnectivity', () => ({
  useSvmConnectivity: () => svmConnectivityEmptyMock,
}));

const dummyDetails = {
  owner: dummyAddress,
  developer: dummyAddress,
  dependencies: [1, 2],
  tokenUrl: 'https://localhost/component/12345',
};

const dummyHashes = {
  componentHashes: ['Component Hash1', 'Component Hash2'],
};

const unmockedFetch = global.fetch;

describe('listComponents/details.jsx', () => {
  beforeAll(() => {
    global.fetch = () =>
      Promise.resolve({
        json: () => Promise.resolve(mockIpfs),
      });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    getComponentDetails.mockResolvedValue(dummyDetails);
    getComponentHashes.mockResolvedValue(dummyHashes);
    getComponentOwner.mockResolvedValue(dummyDetails.owner);
    getTokenUri.mockResolvedValue(dummyDetails.tokenUrl);
  });

  afterAll(() => {
    global.fetch = unmockedFetch;
  });

  it('should display component details', async () => {
    const { getByText, queryByRole, getByTestId } = render(wrapProvider(<Component />));
    await waitFor(async () => {
      // left column content
      expect(getByText('Some package name')).toBeInTheDocument();
      expect(getByTestId('view-hash-link').getAttribute('href')).toBe(`${GATEWAY_URL}12345`);
      expect(getByTestId('view-code-link').getAttribute('href')).toBe(
        `${GATEWAY_URL}${mockCodeUri}`,
      );
      expect(getByTestId('description').textContent).toBe(mockIpfs.description);
      expect(getByTestId('version').textContent).toBe(mockIpfs.attributes[0].value);
      expect(getByTestId('owner-address').textContent).toBe(dummyDetails.developer);
      expect(queryByRole('button', { name: 'Update Hash' })).toBeInTheDocument();
      expect(getByTestId('details-dependency')).toBeInTheDocument();

      // NFT image
      const nftImage = getByTestId('nft-image').querySelector('.ant-image-img');
      expect(nftImage.getAttribute('src')).toBe(`${GATEWAY_URL}${mockNftImageHash}`);
    });
  });

  it('should display update hash button only for owner and open the modal when clicked', async () => {
    getComponentOwner.mockResolvedValue(dummyAddress);
    const { findByRole, findByText, queryByText } = render(wrapProvider(<Component />));
    const updateHashButton = await findByRole('button', {
      name: 'Update Hash',
    });

    if (!updateHashButton) {
      console.log('Update Button not found');
    }

    expect(updateHashButton).toBeInTheDocument();

    // Initially, the modal should not be visible
    expect(queryByText(/Generate IPFS Hash of Metadata File/)).toBeNull();

    await userEvent.click(updateHashButton);

    const modalTitle = await findByText(/Generate IPFS Hash of Metadata File/);
    expect(modalTitle).toBeInTheDocument();
  });

  it('should not display update hash button for non-owner', async () => {
    getComponentOwner.mockResolvedValue('0x123');
    const { queryByRole } = render(wrapProvider(<Component />));

    const updateHashButton = queryByRole('button', { name: 'Update Hash' });
    expect(updateHashButton).toBeNull();
  });
});
