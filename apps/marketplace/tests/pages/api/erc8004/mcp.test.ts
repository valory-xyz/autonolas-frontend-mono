import { generateName } from 'common-util/functions/agentName';

import handler from '../../../../pages/api/erc8004/[network]/ai-agents/[serviceId]/mcp.json';
import {
  CHAIN_ID,
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

type Descriptor = {
  name: string;
  tools: Array<{
    name: string;
    inputSchema?: { type: string; description: string };
    outputSchema?: { type: string; description: string };
  }>;
};

// The handler caches descriptors per service id for the life of the module,
// so every test that changes the manifest uses its own id to start cold.
let nextServiceId = 100;
const freshServiceId = () => String(nextServiceId++);

const call = (serviceId: string) => callHandler(handler, { network: NETWORK, serviceId });

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

  it('uses the pseudonym when the manifest still carries the template name', async () => {
    getIpfsResponse.mockResolvedValue(makeManifest({ name: 'Autonolas Mech III' }));
    const serviceId = freshServiceId();

    const res = await call(serviceId);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(lastJson<Descriptor>(res).name).toBe(generateName(CHAIN_ID, Number(serviceId)));
  });

  it('still lists a tool that publishes no input or output schema, without the schema fields', async () => {
    getIpfsResponse.mockResolvedValue(
      makeManifest({
        tools: ['bare-tool'],
        toolMetadata: { 'bare-tool': { name: 'bare-tool', description: 'No schema published.' } },
      }),
    );

    const res = await call(freshServiceId());
    expect(res.status).toHaveBeenCalledWith(200);

    const { tools } = lastJson<Descriptor>(res);
    expect(tools).toEqual([{ name: 'bare-tool', description: 'No schema published.' }]);
    expect(tools[0]).not.toHaveProperty('inputSchema');
    expect(tools[0]).not.toHaveProperty('outputSchema');
  });
});
