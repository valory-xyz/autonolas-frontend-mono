import { render, waitFor } from '@testing-library/react';
import { useEnsName } from 'wagmi';

import AgentDetails from 'components/ListAgents/details';
import {
  getAgentDetails,
  getAgentHashes,
  getAgentOwner,
  getTokenUri,
} from 'components/ListAgents/utils';
import { NA } from 'libs/util-constants/src';

import {
  dummyAddress,
  mockCodeUri,
  mockNftImageHash,
  mockV1Hash,
  svmConnectivityEmptyMock,
  useHelpersEvmMock,
  wrapProvider,
} from '../../tests-helpers';

// Regression guard for the agent-blueprints "Invalid params" RPC failure:
// `useEnsName` must never receive the `NA` ('n/a') placeholder as `address`.
// Passing 'n/a' makes viem encode it into an ENS CCIP batch-gateway multicall
// that the RPC rejects, poisoning the batch and taking the page's real reads
// (getUnit / mapServiceIdOperatorsCheck) down with it. The fix gates the call
// on `isAddress(ownerAddress)`, passing `undefined` until a real owner resolves.

jest.mock('next/router', () => ({
  __esModule: true,
  useRouter() {
    return { query: { id: '1' } };
  },
}));

jest.mock('wagmi', () => ({
  __esModule: true,
  useEnsName: jest.fn(() => ({ data: undefined })),
}));

jest.mock('libs/common-contract-functions/src', () => ({
  useClaimableIncentives: jest.fn().mockReturnValue({
    reward: '0.85',
    rewardWei: 850000000000000000,
    topUp: '222,777.30',
    topUpWei: 222777300000000000000000000,
  }),
  getPendingIncentives: jest.fn().mockResolvedValue({
    pendingReward: '0.95555',
    pendingTopUp: '200,500.65',
  }),
}));

jest.mock('common-util/List/IpfsHashGenerationModal/helpers', () => ({
  getIpfsHashHelper: jest.fn(() => mockV1Hash),
}));

jest.mock('common-util/Details/utils', () => ({
  checkIfServiceRequiresWhitelisting: jest.fn(() => false),
}));

jest.mock('common-util/Details/DetailsSubInfo/utils', () => ({
  getTokenomicsUnitType: jest.fn(() => 1),
}));

jest.mock('common-util/hooks/useHelpers', () => ({
  useHelpers: () => useHelpersEvmMock,
}));

jest.mock('common-util/hooks/useSvmConnectivity', () => ({
  useSvmConnectivity: () => svmConnectivityEmptyMock,
}));

jest.mock('components/ListAgents/utils', () => ({
  getAgentDetails: jest.fn(),
  getAgentHashes: jest.fn(),
  getAgentOwner: jest.fn(),
  getTokenUri: jest.fn(),
  updateAgentHashes: jest.fn(),
}));

const dummyDetails = {
  owner: dummyAddress,
  developer: dummyAddress,
  dependencies: [1, 2],
  tokenUrl: 'https://localhost/component/12345',
};

const dummyIpfs = {
  image: `ipfs://${mockNftImageHash}`,
  name: 'Some package name',
  description: 'Some description',
  code_uri: `ipfs://${mockCodeUri}`,
  attributes: [{ trait_type: 'version', value: '0.0.0.1' }],
};

const unmockedFetch = global.fetch;

describe('DetailsSubInfo – useEnsName address guard', () => {
  beforeAll(() => {
    global.fetch = () =>
      Promise.resolve({
        json: () => Promise.resolve(dummyIpfs),
      });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    getAgentDetails.mockResolvedValue(dummyDetails);
    getAgentHashes.mockResolvedValue({ agentHashes: [] });
    getTokenUri.mockResolvedValue(dummyDetails.tokenUrl);
  });

  afterAll(() => {
    global.fetch = unmockedFetch;
  });

  it('passes the real owner address to useEnsName once resolved (never the NA placeholder)', async () => {
    getAgentOwner.mockResolvedValue(dummyAddress);

    render(wrapProvider(<AgentDetails />));

    await waitFor(() => {
      expect(useEnsName).toHaveBeenCalledWith(
        expect.objectContaining({ address: dummyAddress, chainId: 1 }),
      );
    });

    expect(useEnsName).not.toHaveBeenCalledWith(expect.objectContaining({ address: NA }));
  });

  it('passes undefined (not NA) to useEnsName while the owner is unresolved/NA', async () => {
    getAgentOwner.mockResolvedValue(NA);

    render(wrapProvider(<AgentDetails />));

    await waitFor(() => {
      expect(getAgentOwner).toHaveBeenCalled();
    });

    expect(useEnsName).toHaveBeenCalledWith(
      expect.objectContaining({ address: undefined, chainId: 1 }),
    );
    expect(useEnsName).not.toHaveBeenCalledWith(expect.objectContaining({ address: NA }));
  });
});
