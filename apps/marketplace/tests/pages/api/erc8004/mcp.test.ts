import handler from '../../../../pages/api/erc8004/[network]/ai-agents/[serviceId]/mcp.json';
import {
  MANIFEST_HASH,
  NETWORK,
  SERVICE_ID,
  callHandler,
  lastJson,
  makeManifest,
  makeMarketplaceService,
} from './fixtures';

jest.mock('common-util/Login/config', () => ({
  EVM_SUPPORTED_CHAINS: [
    { id: 1, networkName: 'ethereum', networkDisplayName: 'Ethereum', vmType: 'EVM' },
    { id: 100, networkName: 'gnosis', networkDisplayName: 'Gnosis', vmType: 'EVM' },
  ],
  SVM_SUPPORTED_CHAINS: [],
  SUPPORTED_CHAINS: [{ id: 1 }, { id: 100 }],
  wagmiConfig: {},
}));
jest.mock('common-util/graphql/services', () => ({
  getServicesFromMarketplaceSubgraph: jest.fn(),
}));
jest.mock('common-util/functions/ipfs', () => ({
  ...jest.requireActual('common-util/functions/ipfs'),
  getIpfsResponse: jest.fn(),
}));

const { getServicesFromMarketplaceSubgraph } = jest.requireMock('common-util/graphql/services') as {
  getServicesFromMarketplaceSubgraph: jest.Mock;
};
const { getIpfsResponse } = jest.requireMock('common-util/functions/ipfs') as {
  getIpfsResponse: jest.Mock;
};

beforeEach(() => {
  jest.clearAllMocks();
  getServicesFromMarketplaceSubgraph.mockResolvedValue([makeMarketplaceService()]);
  getIpfsResponse.mockImplementation(async (hash: string) =>
    hash === MANIFEST_HASH ? makeManifest() : null,
  );
});

describe('GET .../mcp.json', () => {
  it('describes no auth scheme and still lists the tools', async () => {
    const res = await callHandler(handler, {
      network: NETWORK,
      serviceId: SERVICE_ID,
    });
    const body = lastJson<{ auth?: unknown; tools: Array<{ name: string }> }>(res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(body).not.toHaveProperty('auth');
    expect(body.tools.map((tool) => tool.name)).toEqual(['prediction-online']);
  });
});
