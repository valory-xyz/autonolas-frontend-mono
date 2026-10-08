import handler from '../../../../pages/api/erc8004/[network]/ai-agents/[serviceId]';
import { generateName } from 'common-util/functions/agentName';
import {
  AGENT_ID,
  AGENT_WALLET,
  BENCHMARK_URL,
  CHAIN_ID,
  CONFIG_HASH,
  GNOSIS_IDENTITY_REGISTRY,
  MANIFEST_GATEWAY_URL,
  MANIFEST_HASH,
  NETWORK,
  OPERATOR_URL,
  SERVICE_ID,
  callHandler,
  lastJson,
  makeManifest,
  makeMarketplaceService,
  makeRegistryService,
} from './fixtures';

jest.mock('ethers', () => {
  const actual = jest.requireActual('ethers');
  return {
    ...actual,
    ethers: {
      ...actual.ethers,
      Contract: jest.fn(),
      JsonRpcProvider: jest.fn(),
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
jest.mock('common-util/graphql/registry', () => ({
  getServiceFromRegistry: jest.fn(),
}));
jest.mock('common-util/functions/ipfs', () => ({
  ...jest.requireActual('common-util/functions/ipfs'),
  getIpfsResponse: jest.fn(),
}));

const { ethers: mockedEthers } = jest.requireMock('ethers') as {
  ethers: { Contract: jest.Mock };
};
const { getServicesFromMarketplaceSubgraph } = jest.requireMock('common-util/graphql/services') as {
  getServicesFromMarketplaceSubgraph: jest.Mock;
};
const { getServiceFromRegistry } = jest.requireMock('common-util/graphql/registry') as {
  getServiceFromRegistry: jest.Mock;
};
const { getIpfsResponse } = jest.requireMock('common-util/functions/ipfs') as {
  getIpfsResponse: jest.Mock;
};

const DEPLOYED = 4n;
const TERMINATED_BONDED = 5n;

const registryContract = {
  exists: jest.fn(),
  getService: jest.fn(),
};

const unmockedFetch = global.fetch;

const setIpfs = (manifest: unknown) => {
  getIpfsResponse.mockImplementation(async (hash: string) => {
    if (hash === CONFIG_HASH) {
      return {
        name: 'Config name',
        description: 'Config description',
        image: 'ipfs://img',
      };
    }
    if (hash === MANIFEST_HASH) return manifest;
    return null;
  });
};

const serviceNames = (res: ReturnType<typeof lastJson>) =>
  (res as { services: Array<{ name: string }> }).services.map((s) => s.name);

const endpointOf = (body: unknown, name: string) =>
  (body as { services: Array<{ name: string; endpoint: string }> }).services.find(
    (s) => s.name === name,
  )?.endpoint;

beforeEach(() => {
  jest.clearAllMocks();
  mockedEthers.Contract.mockImplementation(() => registryContract);
  registryContract.exists.mockResolvedValue(true);
  registryContract.getService.mockResolvedValue({
    configHash: CONFIG_HASH,
    state: DEPLOYED,
  });
  getServicesFromMarketplaceSubgraph.mockResolvedValue([makeMarketplaceService()]);
  getServiceFromRegistry.mockResolvedValue(makeRegistryService());
  setIpfs(makeManifest());
  global.fetch = jest.fn(async () => {
    throw new Error('registration route must not fetch');
  }) as unknown as typeof fetch;
});

afterAll(() => {
  global.fetch = unmockedFetch;
});

const call = () => callHandler(handler, { network: NETWORK, serviceId: SERVICE_ID });

describe('GET /api/erc8004/[network]/ai-agents/[serviceId] — identity', () => {
  it('names and describes the agent from the mech manifest, with no reputation claim', async () => {
    const res = await call();
    const body = lastJson<Record<string, unknown>>(res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(body.name).toBe('Prediction mech');
    expect(body.description).toBe('Predicts market outcomes.');
    expect(body).not.toHaveProperty('supportedTrust');
    expect(body).not.toHaveProperty('provider');
    expect(body.registrations).toEqual([
      { agentId: AGENT_ID, agentRegistry: `eip155:${CHAIN_ID}:${GNOSIS_IDENTITY_REGISTRY}` },
    ]);
  });

  it('keeps the pseudonym and config description for a service with no mech manifest', async () => {
    getServicesFromMarketplaceSubgraph.mockResolvedValue([]);
    const body = lastJson<Record<string, unknown>>(await call());

    expect(body.name).toBe(generateName(CHAIN_ID, Number(SERVICE_ID)));
    expect(body.description).toBe('Config description');
    expect(serviceNames(body)).toEqual(['web', 'agentWallet']);
  });

  it.each(['Autonolas Mech III', 'Autonolas Mech', 'autonolas mech II'])(
    'keeps the pseudonym and config description when the manifest still carries the template name %p',
    async (templateName) => {
      setIpfs(makeManifest({ name: templateName, description: 'Template description.' }));
      const body = lastJson<Record<string, unknown>>(await call());

      expect(body.name).toBe(generateName(CHAIN_ID, Number(SERVICE_ID)));
      expect(body.description).toBe('Config description');
    },
  );

  it.each([123, null, '', '   ', { nested: true }])(
    'falls back to the pseudonym instead of failing when the manifest name is %p',
    async (badName) => {
      setIpfs(makeManifest({ name: badName as never }));
      const res = await call();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(lastJson<{ name: string }>(res).name).toBe(generateName(CHAIN_ID, Number(SERVICE_ID)));
    },
  );

  it('uses the config description when the manifest has a name but no usable description', async () => {
    setIpfs(makeManifest({ description: 42 as never }));
    const body = lastJson<Record<string, unknown>>(await call());

    expect(body.name).toBe('Prediction mech');
    expect(body.description).toBe('Config description');
  });

  it('caches for one hour at the CDN', async () => {
    const res = await call();
    expect(res.headers['Cache-Control']).toContain('s-maxage=3600');
  });
});

describe('GET /api/erc8004/[network]/ai-agents/[serviceId] — active flag', () => {
  it.each([
    [DEPLOYED, true],
    [TERMINATED_BONDED, false],
    [0n, false],
    [2n, false],
  ])('state %s -> active %s', async (state, active) => {
    registryContract.getService.mockResolvedValue({
      configHash: CONFIG_HASH,
      state,
    });
    const res = await call();
    expect(lastJson<{ active: boolean }>(res).active).toBe(active);
  });
});

describe('GET /api/erc8004/[network]/ai-agents/[serviceId] — KYA links', () => {
  it('lists the manifest, benchmark and operator endpoints', async () => {
    const body = lastJson(await call());

    expect(endpointOf(body, 'manifest')).toBe(MANIFEST_GATEWAY_URL);
    expect(endpointOf(body, 'benchmark')).toBe(BENCHMARK_URL);
    expect(endpointOf(body, 'operator')).toBe(OPERATOR_URL);
    expect(endpointOf(body, 'agentWallet')).toBe(`eip155:${CHAIN_ID}:${AGENT_WALLET}`);
  });

  it('omits the benchmark link when the operator published none', async () => {
    const manifest = makeManifest();
    delete manifest.toolMetadata?.['prediction-online'].benchmark;
    setIpfs(manifest);

    const body = lastJson(await call());
    expect(endpointOf(body, 'benchmark')).toBeUndefined();
    expect(endpointOf(body, 'manifest')).toBe(MANIFEST_GATEWAY_URL);
  });

  it('omits the operator link and never fetches a proof for a domain that is not a bare hostname', async () => {
    setIpfs(
      makeManifest({
        operator: { name: 'Valory', domain: OPERATOR_URL },
      }),
    );

    const body = lastJson(await call());
    expect(endpointOf(body, 'operator')).toBeUndefined();
    expect(body).not.toHaveProperty('provider');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('keeps the A2A and MCP entries for a supplying service', async () => {
    const body = lastJson(await call());
    expect(endpointOf(body, 'A2A')).toContain(
      `/erc8004/${NETWORK}/ai-agents/${SERVICE_ID}/agent-card.json`,
    );
    expect(endpointOf(body, 'MCP')).toContain(
      `/erc8004/${NETWORK}/ai-agents/${SERVICE_ID}/mcp.json`,
    );
  });
});

describe('GET /api/erc8004/[network]/ai-agents/[serviceId] — errors', () => {
  it('returns 404 for a service the registry does not know', async () => {
    registryContract.exists.mockResolvedValue(false);
    const res = await call();
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('rejects a non-numeric serviceId with 400', async () => {
    const res = await callHandler(handler, {
      network: NETWORK,
      serviceId: '7; drop',
    });
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
