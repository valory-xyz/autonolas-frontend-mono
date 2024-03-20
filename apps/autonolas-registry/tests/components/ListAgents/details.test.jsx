import { render, waitFor } from '@testing-library/react';

import { GATEWAY_URL } from '../../../util/constants';
import AgentDetails from '../../../components/ListAgents/details';
import {
  getAgentDetails,
  getAgentHashes,
  getAgentOwner,
  getTokenUri,
} from '../../../components/ListAgents/utils';
import {
  dummyAddress,
  wrapProvider,
  mockNftImageHash,
  mockV1Hash,
  mockCodeUri,
  svmConnectivityEmptyMock,
  useHelpersEvmMock,
} from '../../tests-helpers';

jest.mock('next/router', () => ({
  __esModule: true,
  useRouter() {
    return { query: { id: '1' } };
  },
}));

jest.mock('../../../common-util/List/IpfsHashGenerationModal/helpers', () => ({
  getIpfsHashHelper: jest.fn(() => mockV1Hash),
}));

jest.mock('../../../common-util/Details/utils', () => ({
  checkIfServiceRequiresWhitelisting: jest.fn(() => false),
}));

jest.mock('../../../components/ListAgents/utils', () => ({
  getAgentDetails: jest.fn(),
  getAgentHashes: jest.fn(),
  getAgentOwner: jest.fn(),
  getTokenUri: jest.fn(),
}));

jest.mock('../../../common-util/hooks/useHelpers', () => ({
  useHelpers: () => useHelpersEvmMock,
}));

jest.mock('../../../common-util/hooks/useSvmConnectivity', () => ({
  useSvmConnectivity: () => svmConnectivityEmptyMock,
}));

const dummyDetails = {
  owner: dummyAddress,
  developer: dummyAddress,
  dependencies: [1, 2],
  tokenUrl: 'https://localhost/component/12345',
};

const dummyHashes = {
  agentHashes: ['Agent Hash1', 'Agent Hash2'],
};

const dummyIpfs = {
  image: `ipfs://${mockNftImageHash}`,
  name: 'Some name',
  description: 'Some description',
  code_uri: `ipfs://${mockCodeUri}`,
  attributes: [{ trait_type: 'version', value: '0.0.0.1' }],
};

const unmockedFetch = global.fetch;

describe('listAgents/details.jsx', () => {
  beforeAll(() => {
    global.fetch = () =>
      Promise.resolve({
        json: () => Promise.resolve(dummyIpfs),
      });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    getAgentDetails.mockResolvedValue(dummyDetails);
    getAgentHashes.mockResolvedValue(dummyHashes);
    getAgentOwner.mockResolvedValue(dummyDetails.owner);
    getTokenUri.mockResolvedValue(dummyDetails.tokenUrl);
  });

  afterAll(() => {
    global.fetch = unmockedFetch;
  });

  it('should render agent details', async () => {
    const { getByText, getByTestId, queryByRole } = render(
      wrapProvider(<AgentDetails />),
    );
    await waitFor(async () => {
      // left column content
      expect(getByText('Agent ID 1')).toBeInTheDocument();
      expect(getByTestId('view-hash-link').getAttribute('href')).toBe(
        `${GATEWAY_URL}12345`,
      );
      expect(getByTestId('view-code-link').getAttribute('href')).toBe(
        `${GATEWAY_URL}${mockCodeUri}`,
      );
      expect(getByTestId('description').textContent).toBe(
        dummyIpfs.description,
      );
      expect(getByTestId('version').textContent).toBe(
        dummyIpfs.attributes[0].value,
      );
      expect(getByTestId('owner-address').textContent).toBe(
        dummyDetails.developer,
      );
      expect(
        queryByRole('button', { name: 'Update Hash' }),
      ).toBeInTheDocument();
      expect(getByTestId('details-dependency')).toBeInTheDocument();

      // NFT image
      const nftImage = getByTestId('nft-image').querySelector('.ant-image-img');
      expect(nftImage.getAttribute('src')).toBe(
        `${GATEWAY_URL}${mockNftImageHash}`,
      );
    });
  });
});
