import handler from '../../../../pages/api/erc8004/[network]/ai-agents/[serviceId]/agent-card.json';
import {
  AGENT_ID,
  CHAIN_ID,
  DOMAIN_PROOF_URL,
  GNOSIS_IDENTITY_REGISTRY,
  MANIFEST_HASH,
  MAX_DELIVERY_RATE_WEI,
  MECH_ADDRESS,
  NATIVE_PAYMENT_TYPE,
  NETWORK,
  OPERATOR_URL,
  UNKNOWN_PAYMENT_TYPE,
  USDC_PAYMENT_TYPE,
  callHandler,
  lastJson,
  makeDomainProof,
  makeManifest,
  makeMarketplaceService,
  makeProofFetch,
  makeRegistryService,
} from './fixtures';

const mockProviderDestroy = jest.fn();
jest.mock('ethers', () => {
  const actual = jest.requireActual('ethers');
  return {
    ...actual,
    ethers: {
      ...actual.ethers,
      Contract: jest.fn(),
      JsonRpcProvider: jest.fn(() => ({ destroy: mockProviderDestroy })),
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

const mechContract = {
  maxDeliveryRate: jest.fn(),
  paymentType: jest.fn(),
};

const unmockedFetch = global.fetch;

// The handler caches card bodies per service id for the life of the module,
// so every test uses its own id to start from a cold cache.
let nextServiceId = 100;
const freshServiceId = () => String(nextServiceId++);

const expectNoStore = (res: { headers: Record<string, string> }) =>
  expect(res.headers['Cache-Control']).toBe('no-store');

type Card = {
  name: string;
  provider?: { organization: string; url: string };
  price?: {
    amount: string;
    unit: string | null;
    paymentType: string;
    mechAddress: string;
  };
  metadata: { mechAddress?: string };
};

const call = (serviceId: string) => callHandler(handler, { network: NETWORK, serviceId });

beforeEach(() => {
  jest.clearAllMocks();
  mockedEthers.Contract.mockImplementation(() => mechContract);
  mechContract.maxDeliveryRate.mockResolvedValue(MAX_DELIVERY_RATE_WEI);
  mechContract.paymentType.mockResolvedValue(NATIVE_PAYMENT_TYPE);
  getServicesFromMarketplaceSubgraph.mockImplementation(async ({ serviceIds }) => [
    makeMarketplaceService({ id: serviceIds[0] }),
  ]);
  getServiceFromRegistry.mockImplementation(async ({ id }) =>
    makeRegistryService({ id, erc8004Agent: { id: '7', agentWallet: null } }),
  );
  getIpfsResponse.mockImplementation(async (hash: string) =>
    hash === MANIFEST_HASH ? makeManifest() : null,
  );
  global.fetch = makeProofFetch(makeDomainProof());
});

afterAll(() => {
  global.fetch = unmockedFetch;
});

describe('GET .../agent-card.json — provider', () => {
  it('sets provider from the manifest operator when the domain proof matches', async () => {
    const body = lastJson<Card>(await call(freshServiceId()));
    expect(body.name).toBe('Prediction mech');
    expect(body.provider).toEqual({ organization: 'Valory', url: OPERATOR_URL });
  });

  it('fetches the proof from the exact host without following redirects', async () => {
    await call(freshServiceId());
    expect(global.fetch).toHaveBeenCalledWith(
      DOMAIN_PROOF_URL,
      expect.objectContaining({ redirect: 'error' }),
    );
  });

  it.each([
    [
      'the proof names another agent id',
      () =>
        makeProofFetch(
          makeDomainProof([
            {
              agentRegistry: `eip155:${CHAIN_ID}:${GNOSIS_IDENTITY_REGISTRY}`,
              agentId: AGENT_ID + 1,
            },
          ]),
        ),
    ],
    ['the domain answers 404', () => makeProofFetch(makeDomainProof(), { ok: false, status: 404 })],
    ['the body is not JSON', () => makeProofFetch(undefined, { invalidJson: true })],
  ])('leaves provider unset and caches that verdict when %s', async (_label, fetchFor) => {
    global.fetch = fetchFor();
    const serviceId = freshServiceId();

    const first = lastJson<Card>(await call(serviceId));
    expect(first).not.toHaveProperty('provider');

    global.fetch = makeProofFetch(makeDomainProof());
    const second = lastJson<Card>(await call(serviceId));
    expect(second).not.toHaveProperty('provider');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it.each([
    ['the domain is unreachable', () => makeProofFetch(makeDomainProof(), { reject: true })],
    ['the domain answers 503', () => makeProofFetch(makeDomainProof(), { ok: false, status: 503 })],
    ['the proof read times out', () => makeProofFetch(makeDomainProof(), { hang: true })],
  ])(
    'retries the proof on the next hit instead of caching "no provider" when %s',
    async (_label, fetchFor) => {
      jest.useFakeTimers();
      try {
        global.fetch = fetchFor();
        const serviceId = freshServiceId();

        const firstCall = call(serviceId);
        await jest.advanceTimersByTimeAsync(6_000);
        const first = lastJson<Card>(await firstCall);
        expect(first).not.toHaveProperty('provider');
        expect(first.name).toBe('Prediction mech');

        global.fetch = makeProofFetch(makeDomainProof());
        const second = lastJson<Card>(await call(serviceId));
        expect(second.provider).toEqual({ organization: 'Valory', url: OPERATOR_URL });
        expect(getServicesFromMarketplaceSubgraph).toHaveBeenCalledTimes(1);

        const third = lastJson<Card>(await call(serviceId));
        expect(third.provider).toEqual({ organization: 'Valory', url: OPERATOR_URL });
        expect(global.fetch).toHaveBeenCalledTimes(1);
      } finally {
        jest.useRealTimers();
      }
    },
  );
});

describe('GET .../agent-card.json — price', () => {
  it('reads the price from the mech contract as an integer string with its unit, and tells the CDN not to store it', async () => {
    const res = await call(freshServiceId());
    const body = lastJson<Card>(res);

    expectNoStore(res);
    expect(body.price).toEqual({
      amount: MAX_DELIVERY_RATE_WEI.toString(),
      unit: 'NATIVE',
      paymentType: NATIVE_PAYMENT_TYPE,
      mechAddress: `eip155:${CHAIN_ID}:${MECH_ADDRESS}`,
    });
    expect(mockedEthers.Contract).toHaveBeenCalledWith(
      MECH_ADDRESS,
      expect.arrayContaining([expect.stringContaining('maxDeliveryRate')]),
      expect.anything(),
    );
  });

  it.each([
    [USDC_PAYMENT_TYPE, 'USDC'],
    [UNKNOWN_PAYMENT_TYPE, null],
  ])('maps paymentType %s to unit %s', async (paymentType, unit) => {
    mechContract.paymentType.mockResolvedValue(paymentType);
    const body = lastJson<Card>(await call(freshServiceId()));
    expect(body.price?.unit).toBe(unit);
    expect(body.price?.amount).toBe(MAX_DELIVERY_RATE_WEI.toString());
  });

  it('re-reads the price on a cached card instead of serving the stored one', async () => {
    const serviceId = freshServiceId();

    const first = lastJson<Card>(await call(serviceId));
    expect(first.price?.amount).toBe(MAX_DELIVERY_RATE_WEI.toString());

    mechContract.maxDeliveryRate.mockResolvedValue(MAX_DELIVERY_RATE_WEI * 2n);
    const second = lastJson<Card>(await call(serviceId));

    expect(getServicesFromMarketplaceSubgraph).toHaveBeenCalledTimes(1);
    expect(mechContract.maxDeliveryRate).toHaveBeenCalledTimes(2);
    expect(second.price?.amount).toBe((MAX_DELIVERY_RATE_WEI * 2n).toString());
  });

  it('omits price entirely when the RPC read fails', async () => {
    mechContract.maxDeliveryRate.mockRejectedValue(new Error('rpc down'));
    const res = await call(freshServiceId());
    const body = lastJson<Card>(res);

    expect(res.status).toHaveBeenCalledWith(200);
    expectNoStore(res);
    expect(body).not.toHaveProperty('price');
    expect(body.metadata.mechAddress).toBe(`eip155:${CHAIN_ID}:${MECH_ADDRESS}`);
  });

  it('gives up on a hanging RPC and omits price instead of holding the card', async () => {
    jest.useFakeTimers();
    try {
      mechContract.maxDeliveryRate.mockReturnValue(new Promise(() => undefined));
      const pending = call(freshServiceId());
      await jest.advanceTimersByTimeAsync(3_500);
      const res = await pending;

      expect(res.status).toHaveBeenCalledWith(200);
      expect(lastJson<Card>(res)).not.toHaveProperty('price');
      expect(mockProviderDestroy).toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it('omits price when the service has no mech address', async () => {
    getServicesFromMarketplaceSubgraph.mockImplementation(async ({ serviceIds }) => [
      makeMarketplaceService({ id: serviceIds[0], mechAddresses: [] }),
    ]);
    const body = lastJson<Card>(await call(freshServiceId()));

    expect(body).not.toHaveProperty('price');
    expect(mechContract.maxDeliveryRate).not.toHaveBeenCalled();
  });
});
