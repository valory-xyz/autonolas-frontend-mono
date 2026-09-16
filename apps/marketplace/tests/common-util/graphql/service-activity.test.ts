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
          marketplaceDelivery: { ipfsHashBytes: '0xdelhash', deliveryRate: '10000' },
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
      marketplaceDelivery: { ipfsHashBytes: '0xdelhash', deliveryRate: '10000' },
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

  it('sends the service id as a variable with the squid document', async () => {
    mockRequest.mockResolvedValueOnce({ requests: [], delivers: [] });

    await getServiceActivityFromMarketplaceSubgraph({ chainId: 4663, serviceId: '7' });

    const [doc, variables] = mockRequest.mock.calls[0];
    expect(doc).toContain('$serviceId: String!');
    expect(doc).toContain('id_eq: $serviceId');
    expect(variables).toEqual({ serviceId: '7' });
  });

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
