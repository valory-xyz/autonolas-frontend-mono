import { FetchRequest } from 'ethers';

import { RPC_URLS } from 'libs/util-constants/src';

import handler from '../../../../pages/api/erc8004/[network]/ai-agents/[serviceId]/agent-card.json';
import {
  AGENT_ID,
  CHAIN_ID,
  DOMAIN_PROOF_URL,
  GNOSIS_IDENTITY_REGISTRY,
  MANIFEST_HASH,
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
  ethers: { Contract: jest.Mock; JsonRpcProvider: jest.Mock };
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
  paymentType: jest.fn(),
};

const unmockedFetch = global.fetch;

// The handler caches card bodies per service id for the life of the module,
// so every test uses its own id to start from a cold cache.
let nextServiceId = 100;
const freshServiceId = () => String(nextServiceId++);

type Card = {
  name: string;
  provider?: { organization: string; url: string };
  payment?: { paymentType: string; unit: string | null; mechAddress: string };
  metadata: { mechAddress?: string };
};

const call = (serviceId: string) => callHandler(handler, { network: NETWORK, serviceId });

beforeEach(() => {
  jest.clearAllMocks();
  mockedEthers.Contract.mockImplementation(() => mechContract);
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
      expect.objectContaining({ redirect: 'manual' }),
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
    [
      'the domain redirects (301)',
      () => makeProofFetch(makeDomainProof(), { ok: false, status: 301 }),
    ],
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

describe('GET .../agent-card.json — payment', () => {
  it('states the payment method and the contract, with no amount, and stays CDN cacheable', async () => {
    const res = await call(freshServiceId());
    const body = lastJson<Card>(res);

    expect(body.payment).toEqual({
      paymentType: NATIVE_PAYMENT_TYPE,
      unit: 'NATIVE',
      mechAddress: `eip155:${CHAIN_ID}:${MECH_ADDRESS}`,
    });
    expect(body).not.toHaveProperty('price');
    expect(res.headers['Cache-Control']).toContain('s-maxage=21600');
    expect(mockedEthers.Contract).toHaveBeenCalledWith(
      MECH_ADDRESS,
      ['function paymentType() view returns (bytes32)'],
      expect.anything(),
    );
  });

  it('builds the RPC provider for a single attempt and tears it down', async () => {
    await call(freshServiceId());
    const [request] = mockedEthers.JsonRpcProvider.mock.calls[0];
    expect(request).toBeInstanceOf(FetchRequest);
    expect((request as FetchRequest).url).toBe(RPC_URLS[CHAIN_ID]);
    expect(mockProviderDestroy).toHaveBeenCalled();
  });

  it.each([
    [USDC_PAYMENT_TYPE, 'USDC'],
    [UNKNOWN_PAYMENT_TYPE, null],
  ])('maps paymentType %s to unit %s', async (paymentType, unit) => {
    mechContract.paymentType.mockResolvedValue(paymentType);
    const body = lastJson<Card>(await call(freshServiceId()));
    expect(body.payment?.unit).toBe(unit);
    expect(body.payment?.paymentType).toBe(paymentType);
  });

  it('reads the payment type once and serves it from the cached card afterwards', async () => {
    const serviceId = freshServiceId();
    await call(serviceId);
    const second = lastJson<Card>(await call(serviceId));

    expect(second.payment?.paymentType).toBe(NATIVE_PAYMENT_TYPE);
    expect(mechContract.paymentType).toHaveBeenCalledTimes(1);
    expect(getServicesFromMarketplaceSubgraph).toHaveBeenCalledTimes(1);
  });

  it('omits payment when the RPC read fails and retries it on the next hit', async () => {
    mechContract.paymentType.mockRejectedValueOnce(new Error('rpc down'));
    const serviceId = freshServiceId();

    const first = await call(serviceId);
    expect(first.status).toHaveBeenCalledWith(200);
    expect(lastJson<Card>(first)).not.toHaveProperty('payment');

    const second = lastJson<Card>(await call(serviceId));
    expect(second.payment?.paymentType).toBe(NATIVE_PAYMENT_TYPE);
    expect(mechContract.paymentType).toHaveBeenCalledTimes(2);
    expect(getServicesFromMarketplaceSubgraph).toHaveBeenCalledTimes(1);

    await call(serviceId);
    expect(mechContract.paymentType).toHaveBeenCalledTimes(2);
  });

  it('gives up on a hanging RPC and omits payment instead of holding the card', async () => {
    jest.useFakeTimers();
    try {
      mechContract.paymentType.mockReturnValue(new Promise(() => undefined));
      const pending = call(freshServiceId());
      await jest.advanceTimersByTimeAsync(3_500);
      const res = await pending;

      expect(res.status).toHaveBeenCalledWith(200);
      expect(lastJson<Card>(res)).not.toHaveProperty('payment');
      expect(mockProviderDestroy).toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it('omits payment when the service has no mech address', async () => {
    getServicesFromMarketplaceSubgraph.mockImplementation(async ({ serviceIds }) => [
      makeMarketplaceService({ id: serviceIds[0], mechAddresses: [] }),
    ]);
    const body = lastJson<Card>(await call(freshServiceId()));

    expect(body).not.toHaveProperty('payment');
    expect(mechContract.paymentType).not.toHaveBeenCalled();
  });
});
