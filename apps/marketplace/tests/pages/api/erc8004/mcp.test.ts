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

const registryContract = { getService: jest.fn() };
jest.mock('ethers', () => {
  const actual = jest.requireActual('ethers');
  return {
    ...actual,
    ethers: {
      ...actual.ethers,
      Contract: jest.fn(() => registryContract),
      JsonRpcProvider: jest.fn(() => ({ destroy: jest.fn() })),
    },
  };
});
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

const CONFIG_HASH = '0xconfig';

beforeEach(() => {
  jest.clearAllMocks();
  registryContract.getService.mockResolvedValue({ configHash: CONFIG_HASH });
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

  it('uses the service config description for a template-named mech', async () => {
    getIpfsResponse.mockImplementation(async (hash: string) => {
      if (hash === MANIFEST_HASH) return makeManifest({ name: 'Autonolas Mech III' });
      if (hash === CONFIG_HASH) return { description: 'Prediction service run by Bob.' };
      return null;
    });
    const res = await call(freshServiceId());
    expect(lastJson<{ description: string }>(res).description).toBe(
      'Prediction service run by Bob.',
    );
  });

  it('gives up on a hanging registry read and serves the manifest description', async () => {
    getIpfsResponse.mockImplementation(async (hash: string) =>
      hash === MANIFEST_HASH ? makeManifest({ name: 'Autonolas Mech III' }) : null,
    );
    registryContract.getService.mockReturnValue(new Promise(() => undefined));
    jest.useFakeTimers();
    try {
      let answered = false;
      const pending = call(freshServiceId()).then((res) => {
        answered = true;
        return res;
      });
      await jest.advanceTimersByTimeAsync(3_500);
      const res = await pending;

      expect(answered).toBe(true);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(lastJson<{ description: string }>(res).description).toBe(makeManifest().description);
    } finally {
      jest.useRealTimers();
    }
  });

  it('keeps the manifest description of a mech with its own name', async () => {
    getIpfsResponse.mockResolvedValue(makeManifest({ name: 'Profit Pulse Mech' }));
    const res = await call(freshServiceId());
    expect(lastJson<{ description: string }>(res).description).toBe(makeManifest().description);
    expect(registryContract.getService).not.toHaveBeenCalled();
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
