import handler from '../../../../pages/api/erc8004/[network]/ai-agents/[serviceId]';
import {
  AGENT_ID,
  AGENT_WALLET,
  BENCHMARK_URL,
  CHAIN_ID,
  CONFIG_HASH,
  GNOSIS_IDENTITY_REGISTRY,
  MANIFEST_GATEWAY_URL,
  MANIFEST_HASH,
  MECH_ADDRESS,
  NETWORK,
  OPERATOR_URL,
  SERVICE_ID,
  callHandler,
  lastJson,
  makeDomainProof,
  makeManifest,
  makeMarketplaceService,
  makeProofFetch,
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
  global.fetch = makeProofFetch(makeDomainProof());
});

afterAll(() => {
  global.fetch = unmockedFetch;
});

const call = () => callHandler(handler, { network: NETWORK, serviceId: SERVICE_ID });

describe('GET /api/erc8004/[network]/ai-agents/[serviceId] — identity', () => {
  it('names the agent after the mech manifest, with no reputation claim', async () => {
    const res = await call();
    const body = lastJson<Record<string, unknown>>(res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(body.name).toBe('Prediction mech');
    expect(body).not.toHaveProperty('supportedTrust');
    expect(body.registrations).toEqual([
      {
        agentId: AGENT_ID,
        agentRegistry: `eip155:${CHAIN_ID}:${GNOSIS_IDENTITY_REGISTRY}`,
      },
    ]);
  });

  it('falls back to the service config name when the service has no mech manifest', async () => {
    getServicesFromMarketplaceSubgraph.mockResolvedValue([]);
    const res = await call();
    const body = lastJson<Record<string, unknown>>(res);

    expect(body.name).toBe('Config name');
    expect(serviceNames(body)).toEqual(['web', 'agentWallet']);
    expect(body).not.toHaveProperty('provider');
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

describe('GET /api/erc8004/[network]/ai-agents/[serviceId] — provider', () => {
  it('sets provider when the domain proof names this registry and agent id', async () => {
    const body = lastJson<{ provider?: unknown }>(await call());
    expect(body.provider).toEqual({
      organization: 'Valory',
      url: OPERATOR_URL,
    });
  });

  it('accepts a lowercase registry address and a string agent id in the proof', async () => {
    global.fetch = makeProofFetch(
      makeDomainProof([
        {
          agentRegistry: `eip155:${CHAIN_ID}:${GNOSIS_IDENTITY_REGISTRY.toLowerCase()}`,
          agentId: String(AGENT_ID),
        },
      ]),
    );
    const body = lastJson<{ provider?: unknown }>(await call());
    expect(body.provider).toEqual({
      organization: 'Valory',
      url: OPERATOR_URL,
    });
  });

  it.each([
    [
      'a different agent id',
      makeProofFetch(
        makeDomainProof([
          {
            agentRegistry: `eip155:${CHAIN_ID}:${GNOSIS_IDENTITY_REGISTRY}`,
            agentId: AGENT_ID + 1,
          },
        ]),
      ),
    ],
    [
      'a different chain',
      makeProofFetch(
        makeDomainProof([
          {
            agentRegistry: `eip155:1:${GNOSIS_IDENTITY_REGISTRY}`,
            agentId: AGENT_ID,
          },
        ]),
      ),
    ],
    [
      'a different registry',
      makeProofFetch(
        makeDomainProof([
          {
            agentRegistry: `eip155:${CHAIN_ID}:${MECH_ADDRESS}`,
            agentId: AGENT_ID,
          },
        ]),
      ),
    ],
    ['an empty proof', makeProofFetch({ registrations: [] })],
    ['a malformed proof', makeProofFetch('not json object')],
    ['a 404 from the operator domain', makeProofFetch(makeDomainProof(), { ok: false })],
    ['an unreachable operator domain', makeProofFetch(makeDomainProof(), { reject: true })],
  ])('leaves provider unset for %s but keeps the operator link', async (_label, fetchStub) => {
    global.fetch = fetchStub;
    const body = lastJson<{ provider?: unknown }>(await call());

    expect(body).not.toHaveProperty('provider');
    expect(endpointOf(body, 'operator')).toBe(OPERATOR_URL);
  });

  it('leaves provider unset when the service has no ERC-8004 registration', async () => {
    getServiceFromRegistry.mockResolvedValue(makeRegistryService({ erc8004Agent: null }));
    const body = lastJson<{ provider?: unknown; registrations: unknown[] }>(await call());

    expect(body.registrations).toEqual([]);
    expect(body).not.toHaveProperty('provider');
    expect(global.fetch).not.toHaveBeenCalled();
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
