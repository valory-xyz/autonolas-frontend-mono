import { render, waitFor } from '@testing-library/react';
// import { within } from '@testing-library/dom';
import { GATEWAY_URL } from 'util/constants';
import Services from '../../../components/ListServices/details';
import {
  getTokenDetailsRequest,
  checkIfServiceRequiresWhitelisting,
} from '../../../common-util/Details/utils';
import {
  useAgentInstanceAndOperator,
  useGetSvmServiceDetails,
  useServiceOwner,
  useTokenUri,
  useSvmServiceTableDataSource,
  useSvmBonds,
} from '../../../components/ListServices/useSvmService';
// import { useMetadata } from '../../../common-util/hooks/useMetadata';
import { useHelpers } from '../../../common-util/hooks/useHelpers';
import { useSvmConnectivity } from '../../../common-util/hooks/useSvmConnectivity';
import {
  getBonds,
  getServiceTableDataSource,
  getAgentInstanceAndOperator,
  checkIfEth,
  getTokenBondRequest,
} from '../../../components/ListServices/ServiceState/utils';
import {
  // useFinishRegistration,
  // useGetActivateRegistration,
  useRegisterAgents,
  // useTerminate,
  // useUnbond,
} from '../../../components/ListServices/ServiceState/useSvmServiceStateManagement';
import {
  useGetServiceDetails,
  useGetServiceOwner,
  // useGetServiceTokenUri,
} from '../../../components/ListServices/useService';
import {
  dummyAddress,
  wrapProvider,
  mockNftImageHash,
  mockV1Hash,
  mockIpfs,
  mockCodeUri,
  svmConnectivityEmptyMock,
  useHelpersEvmMock,
  useHelpersSvmMock,
  svmServiceStateMock,
} from '../../tests-helpers';
// useGetServiceDetails
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
  getTokenDetailsRequest: jest.fn(),
  checkIfServiceRequiresWhitelisting: jest.fn(),
}));

jest.mock('../../../common-util/hooks/useSvmConnectivity', () => ({
  useSvmConnectivity: jest.fn(),
}));

jest.mock('../../../common-util/hooks/useMetadata', () => ({
  useMetadata: jest.fn(() => ({
    metadataLoadState: 'LOADED',
    hashUrl: `${GATEWAY_URL}12345`,
    codeHref: `${GATEWAY_URL}${mockCodeUri}`,
    nftImageUrl: `${GATEWAY_URL}${mockNftImageHash}`,
    description: mockIpfs.description,
    version: mockIpfs.attributes[0].value,
  })),
}));

jest.mock('../../../common-util/Details/useDetails', () => ({
  useDetails: jest.fn(() => ({
    isLoading: false,
    info: dummyDetails,
    ownerAddress: dummyAddress,
    isOwner: true,
  })),
}));

jest.mock('../../../common-util/hooks/useHelpers', () => ({
  useHelpers: () => ({ isSvm: false }),
}));

jest.mock('../../../components/ListServices/ServiceState/utils', () => ({
  getTokenBondRequest: jest.fn(),
  checkIfEth: jest.fn(),
  getServiceTableDataSource: jest.fn(),
  getBonds: jest.fn(),
  getAgentInstanceAndOperator: jest.fn(),
  getServiceAgentInstances: jest.fn(() =>
    Promise.resolve({
      agentInstances: '0xc7daF473C103aa2B112FE2F773E3A508A6999BB6',
      numAgentInstances: 1,
    }),
  ),
}));

jest.mock('../../../components/ListServices/useSvmService', () => ({
  useAgentInstanceAndOperator: jest.fn(() => ({
    getSvmAgentInstanceAndOperator: jest.fn(),
  })),
  useGetSvmServiceDetails: jest.fn(),
  useServiceOwner: jest.fn(),
  useTokenUri: jest.fn(),
  useSvmServiceTableDataSource: jest.fn(() => ({
    getSvmServiceTableDataSource: jest.fn(),
  })),
  useSvmBonds: jest.fn(() => ({
    getSvmBonds: jest.fn(),
  })),
}));

jest.mock(
  '../../../components/ListServices/ServiceState/useSvmServiceStateManagement',
  () => ({
    useFinishRegistration: jest.fn(),
    useGetActivateRegistration: jest.fn(),
    useRegisterAgents: jest.fn(() => ({
      checkIfAgentInstancesAreValid: jest.fn(),
      registerAgents: jest.fn(),
    })),
    useTerminate: jest.fn(),
    useUnbond: jest.fn(),
  }),
);

jest.mock('../../../components/ListServices/useService', () => ({
  useGetServiceDetails: jest.fn(),
  useGetServiceOwner: jest.fn(),
  useGetServiceTokenUri: jest.fn(),
}));

const dummyDetails = {
  owner: dummyAddress,
  agentIds: ['1'],
  agentParams: [
    ['1', '1000'],
    ['2', '1000'],
    ['3', '1000'],
  ],
  threshold: '5',
  id: 1,
  tokenUrl: 'https://localhost/service/12345',
  bonds: ['1'],
  state: '5',
};

// const dummyHashes = {
//   configHashes: ['Service Hash1', 'Service Hash2'],
// };

const unmockedFetch = global.fetch;

describe('listServices/details.jsx', () => {
  beforeAll(() => {
    global.fetch = () =>
      Promise.resolve({ json: () => Promise.resolve(mockIpfs) });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = unmockedFetch;
  });

  describe('EVM', () => {
    beforeEach(() => {
      // mock hooks
      useHelpers.mockReturnValue(useHelpersEvmMock);
      useSvmConnectivity.mockReturnValue(svmConnectivityEmptyMock);
      useGetServiceDetails.mockReturnValue({
        getServiceDetails: jest.fn(() => dummyDetails),
      });
      useGetServiceOwner.mockReturnValue({
        getOwner: jest.fn(() => dummyDetails.owner),
      });
      useTokenUri.mockReturnValue({
        getTokenUri: jest.fn(() => `${GATEWAY_URL}${mockCodeUri}`),
      });

      // mock functions
      checkIfEth.mockReturnValueOnce(true);
      checkIfServiceRequiresWhitelisting.mockReturnValueOnce(false);
      getAgentInstanceAndOperator.mockReturnValueOnce(
        Promise.resolve({
          id: 'agent-instance-row-1',
          operatorAddress: 'operator_address_1',
          agentInstance: 'agent_instance_1',
        }),
      );
      getTokenDetailsRequest.mockReturnValueOnce(
        Promise.resolve({
          securityDeposit: '0',
          token: '0x0000000000000000000000000000000000000000',
        }),
      );
      getBonds.mockReturnValueOnce(
        Promise.resolve({
          bonds: ['1000000000000000', '1000000000000000'],
          slots: ['1', '1'],
          totalBonds: 0,
        }),
      );
      getServiceTableDataSource.mockReturnValueOnce(
        Promise.resolve([
          {
            agentAddresses: null,
            agentId: '2',
            availableSlots: 0,
            bond: '1000000000000000',
            key: '2',
            totalSlots: '4',
          },
        ]),
      );
      getTokenBondRequest.mockReturnValueOnce(
        Promise.resolve({
          bonds: ['1000000000000000', '1000000000000000'],
          slots: ['1', '1'],
          totalBonds: 0,
        }),
      );
    });

    it('should render service details (left side)', async () => {
      const { getByText, getByTestId } = render(wrapProvider(<Services />));
      await waitFor(async () => {
        expect(getByText('Service ID 1')).toBeInTheDocument();
        expect(getByTestId('service-status').textContent).toBe('Inactive');
        expect(getByTestId('view-hash-link').getAttribute('href')).toBe(
          `${GATEWAY_URL}12345`,
        );
        expect(getByTestId('view-code-link').getAttribute('href')).toBe(
          `${GATEWAY_URL}${mockCodeUri}`,
        );

        // NFT image (display on left side for services)
        const displayedImage =
          getByTestId('service-nft-image').querySelector('img');
        expect(displayedImage.src).toBe(`${GATEWAY_URL}${mockNftImageHash}`);

        expect(getByTestId('description').textContent).toBe(
          mockIpfs.description,
        );
        expect(getByTestId('version').textContent).toBe(
          mockIpfs.attributes[0].value,
        );
        expect(getByTestId('owner-address').textContent).toBe(
          dummyDetails.owner,
        );
        expect(getByText('Threshold')).toBeInTheDocument();
        expect(getByText('Operator Whitelisting')).toBeInTheDocument();
      });
    });

    // TODO: add brief tests for operator whitelisting

    it('should render service state (right side)', async () => {
      const { container } = render(wrapProvider(<Services />));
      await waitFor(async () => {
        const getTitle = (i) =>
          container.querySelector(
            `.ant-steps-item:nth-child(${i}) .ant-steps-item-title`,
          );
        expect(getTitle(1)).toHaveTextContent('Pre-Registration');
        expect(getTitle(2)).toHaveTextContent('Active Registration');
        expect(getTitle(3)).toHaveTextContent('Finished Registration');
        expect(getTitle(4)).toHaveTextContent('Deployed');
        expect(getTitle(5)).toHaveTextContent('Terminated Bonded');

        // last step (Terminated Bonded) should be active
        expect(
          container.querySelector('.ant-steps-item-active'),
        ).toHaveTextContent('Terminated Bonded');
      });
    });
  });

  describe('SVM', () => {
    beforeEach(() => {
      // mock hooks
      useHelpers.mockReturnValue(useHelpersSvmMock);
      useSvmConnectivity.mockReturnValue(svmConnectivityEmptyMock);
      useGetSvmServiceDetails.mockReturnValue({
        getSvmServiceDetails: jest.fn(() => svmServiceStateMock),
      });
      useServiceOwner.mockReturnValue(svmServiceStateMock.owner);
      useTokenUri.mockReturnValue(`${GATEWAY_URL}${mockCodeUri}`);
      useAgentInstanceAndOperator.mockReturnValueOnce({
        getSvmAgentInstanceAndOperator: jest.fn(() => ({
          agentInstance: 'Em4vhJBAsohCNpNj2HpNaJs8jaQCprpkhvEZR2m9BL45',
          id: 'agent-instance-row-1',
          operatorAddress: 'h7oMpeDaFX1NQ6k2RsGeM6cCXSpCoCyLMqy7p1NdiXK',
        })),
      });
      useSvmServiceTableDataSource.mockReturnValueOnce({
        getSvmServiceTableDataSource: jest.fn(() => [
          {
            agentAddresses: null,
            agentId: '2',
            availableSlots: 0,
            bond: '1000000000000000',
            key: '2',
            totalSlots: '4',
          },
        ]),
      });
      useSvmBonds.mockReturnValueOnce({
        getSvmBonds: jest.fn(() => ({
          bonds: ['1000000000000000', '1000000000000000'],
          slots: ['1', '1'],
          totalBonds: 0,
        })),
      });
      useRegisterAgents.mockReturnValueOnce({
        checkIfAgentInstancesAreValid: jest.fn(),
        registerAgents: jest.fn(),
      });

      // mock functions
      checkIfEth.mockReturnValueOnce(false);
      checkIfServiceRequiresWhitelisting.mockReturnValueOnce(false);
      getAgentInstanceAndOperator.mockReturnValueOnce(
        Promise.resolve({
          id: 'agent-instance-row-1',
          operatorAddress: 'operator_address_1',
          agentInstance: 'agent_instance_1',
        }),
      );
      getTokenDetailsRequest.mockReturnValueOnce(
        Promise.resolve({
          securityDeposit: '0',
          token: '0x0000000000000000000000000000000000000000',
        }),
      );
      getBonds.mockReturnValueOnce(
        Promise.resolve({
          bonds: ['1000000000000000', '1000000000000000'],
          slots: ['1', '1'],
          totalBonds: 0,
        }),
      );
      getTokenBondRequest.mockReturnValueOnce([]);
      // getServiceTableDataSource.mockReturnValueOnce(
      //   Promise.resolve([
      //     {
      //       agentAddresses: null,
      //       agentId: '2',
      //       availableSlots: 0,
      //       bond: '1000000000000000',
      //       key: '2',
      //       totalSlots: '4',
      //     },
      //   ]),
      // );
    });

    it('should render service details (left side)', async () => {
      const { getByText, getByTestId, queryByText, queryByTestId } = render(
        wrapProvider(<Services />),
      );
      await waitFor(async () => {
        expect(getByText('Service ID 1')).toBeInTheDocument();
        expect(getByTestId('service-status').textContent).toBe('Inactive');
        expect(getByTestId('view-hash-link').getAttribute('href')).toBe(
          `${GATEWAY_URL}12345`,
        );
        expect(getByTestId('view-code-link').getAttribute('href')).toBe(
          `${GATEWAY_URL}${mockCodeUri}`,
        );

        // NFT image should not be displayed for SVM services
        // expect(queryByTestId('service-nft-image')).toBeNull();

        expect(getByTestId('description').textContent).toBe(
          mockIpfs.description,
        );
        // expect(getByTestId('version').textContent).toBe(
        //   mockIpfs.attributes[0].value,
        // );
        expect(getByTestId('owner-address').textContent).toBe(
          dummyDetails.owner,
        );
        expect(getByText('Threshold')).toBeInTheDocument();

        // Operator Whitelisting should not be displayed for SVM services
        // expect(queryByText('Operator Whitelisting')).toBeNull();
      });
    });

    it('should render service state (right side)', async () => {
      const { container } = render(wrapProvider(<Services />));
      await waitFor(async () => {
        const getTitle = (i) =>
          container.querySelector(
            `.ant-steps-item:nth-child(${i}) .ant-steps-item-title`,
          );
        expect(getTitle(1)).toHaveTextContent('Pre-Registration');
        expect(getTitle(2)).toHaveTextContent('Active Registration');
        expect(getTitle(3)).toHaveTextContent('Finished Registration');

        // deployed step
        expect(getTitle(4)).toHaveTextContent('Deployed');
        // expect(
        //   within(getByTestId('step-deployed')).getByText(
        //     'Squads contract address',
        //   ),
        // ).toBeInTheDocument();

        expect(getTitle(5)).toHaveTextContent('Terminated Bonded');

        // last step (Terminated Bonded) should be active
        expect(
          container.querySelector('.ant-steps-item-active'),
        ).toHaveTextContent('Terminated Bonded');
      });
    });
  });
});
