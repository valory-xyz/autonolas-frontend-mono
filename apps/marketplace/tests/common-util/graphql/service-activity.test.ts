import {
  getServiceActivityFromMarketplaceSubgraph,
  LEGACY_DELIVERY_PAYMENT_WEI,
} from 'common-util/graphql/service-activity';

const mockRequest = jest.fn();

jest.mock('common-util/graphql/index', () => ({
  MARKETPLACE_SUBGRAPH_CLIENTS: {
    100: {
      get request() {
        return mockRequest;
      },
    },
    137: {
      get request() {
        return mockRequest;
      },
    },
    8453: {
      get request() {
        return mockRequest;
      },
    },
    4663: {
      get request() {
        return mockRequest;
      },
    },
  },
}));

const SENDER = '0xaaa0000000000000000000000000000000000001';
const MECH = '0xbbb0000000000000000000000000000000000002';

/** A squid-shaped response: marketplace payloads only, no legacy mech entities. */
const squidResponse = {
  requests: [
    {
      id: 'req-1',
      blockTimestamp: '200',
      transactionHash: '0xreq',
      sender: { id: SENDER },
      feeUSD: '0.01',
      finalFeeUSD: null,
      feeRaw: '10000',
      feeUnit: 'USDC',
      marketplaceRequest: { ipfsHashBytes: '0xreqhash' },
      deliveries: [
        {
          mech: MECH,
          transactionHash: '0xdel',
          blockTimestamp: '300',
          marketplaceDelivery: {
            ipfsHashBytes: '0xdelhash',
            deliveryRate: '10000',
          },
        },
      ],
    },
  ],
  delivers: [
    {
      id: 'del-1',
      mech: MECH,
      blockTimestamp: '300',
      transactionHash: '0xdel',
      marketplaceDelivery: {
        ipfsHashBytes: '0xdelhash',
        deliveryRate: '10000',
      },
      request: {
        id: 'req-1',
        blockTimestamp: '200',
        transactionHash: '0xreq',
        sender: { id: SENDER },
        marketplaceRequest: { ipfsHashBytes: '0xreqhash' },
      },
    },
  ],
};

describe('getServiceActivityFromMarketplaceSubgraph', () => {
  beforeEach(() => mockRequest.mockReset());

  it.each([137, 8453, 4663] as const)(
    'sends the service id with the squid document on %s',
    async (chainId) => {
      mockRequest.mockResolvedValueOnce({ requests: [], delivers: [] });

      await getServiceActivityFromMarketplaceSubgraph({
        chainId,
        serviceId: '7',
      });

      const [doc, variables] = mockRequest.mock.calls[0];
      expect(doc).toContain('$serviceId: String!');
      expect(doc).toContain('id_eq: $serviceId');
      expect(variables).toEqual({ serviceId: '7' });
    },
  );

  it('converts a squid-shaped response (marketplace payloads only) on both sides', async () => {
    mockRequest.mockResolvedValueOnce(squidResponse);

    const { id, activities } = await getServiceActivityFromMarketplaceSubgraph({
      chainId: 4663,
      serviceId: '7',
    });

    expect(id).toBe('7');
    // Supply (delivery at 300) sorts before Demand (request at 200).
    expect(activities.map((a) => a.activityType)).toEqual(['Supply', 'Demand']);
    for (const activity of activities) {
      expect(activity.requestId).toBe('req-1');
      expect(activity.requestIpfsHash).toBe('0xreqhash');
      expect(activity.deliveryIpfsHash).toBe('0xdelhash');
      expect(activity.requestedBy).toBe(SENDER);
      expect(activity.deliveredBy).toBe(MECH);
      // No legacy mechDelivery on the squid: payment is the marketplace delivery rate.
      expect(activity.payment).toBe('10000');
      expect(activity.payment).not.toBe(LEGACY_DELIVERY_PAYMENT_WEI);
    }
    const [demand] = activities.filter((a) => a.activityType === 'Demand');
    expect(demand.feeUSD).toBe('0.01');
    expect(demand.feeUnit).toBe('USDC');
  });

  it('leaves the hashes undefined when no payload carries one', async () => {
    mockRequest.mockResolvedValueOnce({
      requests: [
        {
          id: 'req-2',
          blockTimestamp: '1',
          transactionHash: '0x1',
          sender: { id: SENDER },
          marketplaceRequest: {},
          deliveries: [],
        },
      ],
      delivers: [],
    });

    const { activities } = await getServiceActivityFromMarketplaceSubgraph({
      chainId: 4663,
      serviceId: '7',
    });

    expect(activities).toHaveLength(1);
    expect(activities[0].requestIpfsHash).toBeUndefined();
    expect(activities[0].deliveryIpfsHash).toBeUndefined();
    expect(activities[0].payment).toBeNull();
  });
});

describe('getServiceActivityFromMarketplaceSubgraph — fee unit from the mech payment type', () => {
  beforeEach(() => mockRequest.mockReset());

  const PT_USDC = '0x6406bb5f31a732f898e1ce9fdd988a80a808d36ab5d9a4a4805a8be8d197d5e3';
  const PT_NATIVE = '0xba699a34be8fe0e7725e93dcbce1701b0211a8ca61330aaeb8a05bf2ec7abed1';

  /** A signed-only (off-chain) delivery: no `Request` entity, so no fee unit. */
  const offChainDeliver = (overrides: Record<string, unknown> = {}) => ({
    id: 'del-offchain',
    mech: MECH,
    blockTimestamp: '300',
    transactionHash: '0xdel',
    marketplaceDelivery: { ipfsHashBytes: '0xdelhash', deliveryRate: '20000' },
    request: null,
    ...overrides,
  });

  it.each([
    [100, 'graph', 'meches (where: {service_: {id: $serviceId}}'],
    [4663, 'squid', 'meches (where: {service: {id_eq: $serviceId}}'],
  ] as const)('queries the service mechs on %s (%s dialect)', async (chainId, _dialect, frag) => {
    mockRequest.mockResolvedValueOnce({
      requests: [],
      delivers: [],
      meches: [],
    });

    await getServiceActivityFromMarketplaceSubgraph({
      chainId,
      serviceId: '7',
    });

    const [doc] = mockRequest.mock.calls[0];
    expect(doc).toContain(frag);
    expect(doc).toMatch(/meches \([^)]*\)\s*\{\s*address\s+paymentType\s*\}/);
  });

  it('formats an off-chain delivery from a USDC mech as USDC, not wei of the native coin', async () => {
    mockRequest.mockResolvedValueOnce({
      requests: [],
      delivers: [offChainDeliver()],
      // Mixed-case address: the lookup is case-insensitive.
      meches: [
        {
          address: MECH.toUpperCase().replace('0X', '0x'),
          paymentType: PT_USDC,
        },
      ],
    });

    const { activities } = await getServiceActivityFromMarketplaceSubgraph({
      chainId: 137,
      serviceId: '7',
    });

    expect(activities).toHaveLength(1);
    expect(activities[0].feeUnit).toBe('USDC');
    expect(activities[0].feeRaw).toBe('20000');
    expect(activities[0].finalFeeUSD).toBe('0.02');
  });

  it('labels an off-chain delivery from a native mech as NATIVE wei', async () => {
    mockRequest.mockResolvedValueOnce({
      requests: [],
      delivers: [
        offChainDeliver({
          marketplaceDelivery: {
            ipfsHashBytes: '0xdelhash',
            deliveryRate: '10000000000000000',
          },
        }),
      ],
      meches: [{ address: MECH, paymentType: PT_NATIVE }],
    });

    const { activities } = await getServiceActivityFromMarketplaceSubgraph({
      chainId: 100,
      serviceId: '7',
    });

    expect(activities[0].feeUnit).toBe('NATIVE');
    expect(activities[0].feeRaw).toBe('10000000000000000');
    expect(activities[0].finalFeeUSD).toBeNull();
  });

  it('keeps the request fee fields when the request already has a fee unit', async () => {
    mockRequest.mockResolvedValueOnce({
      requests: [],
      delivers: [
        offChainDeliver({
          request: {
            id: 'req-1',
            blockTimestamp: '200',
            transactionHash: '0xreq',
            sender: { id: SENDER },
            feeUnit: 'NATIVE',
            feeRaw: '5',
            finalFeeUSD: '1.5',
          },
        }),
      ],
      meches: [{ address: MECH, paymentType: PT_USDC }],
    });

    const { activities } = await getServiceActivityFromMarketplaceSubgraph({
      chainId: 100,
      serviceId: '7',
    });

    expect(activities[0].feeUnit).toBe('NATIVE');
    expect(activities[0].feeRaw).toBe('5');
    expect(activities[0].finalFeeUSD).toBe('1.5');
  });

  it('leaves legacy AgentMech deliveries on the fixed 0.01 xDAI payment', async () => {
    mockRequest.mockResolvedValueOnce({
      requests: [],
      delivers: [
        offChainDeliver({
          marketplaceDelivery: null,
          mechDelivery: { ipfsHash: 'bafy-legacy' },
        }),
      ],
      meches: [{ address: MECH, paymentType: PT_USDC }],
    });

    const { activities } = await getServiceActivityFromMarketplaceSubgraph({
      chainId: 100,
      serviceId: '7',
    });

    expect(activities[0].payment).toBe(LEGACY_DELIVERY_PAYMENT_WEI);
    expect(activities[0].feeUnit).toBeNull();
    expect(activities[0].finalFeeUSD).toBeNull();
  });

  it('leaves the fee unit empty when the delivering mech is not found', async () => {
    mockRequest.mockResolvedValueOnce({
      requests: [],
      delivers: [offChainDeliver()],
      meches: [],
    });

    const { activities } = await getServiceActivityFromMarketplaceSubgraph({
      chainId: 4663,
      serviceId: '7',
    });

    expect(activities[0].payment).toBe('20000');
    expect(activities[0].feeUnit).toBeNull();
  });
});
