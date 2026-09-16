import {
  getServiceEndpointsFromMarketplaceSubgraph,
  getServicesFromMarketplaceSubgraph,
} from 'common-util/graphql/services';

const mockRequest = jest.fn();

jest.mock('common-util/graphql/index', () => ({
  MARKETPLACE_SUBGRAPH_CLIENTS: {
    100: {
      get request() {
        return mockRequest;
      },
    },
    // Robinhood: squid dialect (see common-util/graphql/dialect.ts)
    4663: {
      get request() {
        return mockRequest;
      },
    },
  },
}));

type ServiceRow = {
  id: string;
  totalRequests?: string;
  totalDeliveries?: string;
  latestMultisig?: string | null;
  historicalMultisigs?: string[] | null;
  metadata?: { metadata?: string }[];
  mechs?: { id: string; address: string }[];
};

/**
 * The module issues two sequential requests: services+meches, then senders.
 * The sender call is skipped entirely when no service has a multisig.
 */
const mockSubgraph = ({
  services = [],
  meches = [],
  senders = [],
}: {
  services?: ServiceRow[];
  meches?: { id: string; totalDeliveriesTransactions: string }[];
  senders?: { id: string; totalLegacyRequests: string; totalMarketplaceRequests?: string }[];
}) => {
  mockRequest.mockReset();
  mockRequest
    .mockResolvedValueOnce({ services, meches })
    .mockResolvedValueOnce({ senders })
    // Any further call is a bug in the module, not in the fixture.
    .mockRejectedValue(new Error('unexpected third subgraph request'));
};

const getServices = () => getServicesFromMarketplaceSubgraph({ chainId: 100, serviceIds: ['1'] });

const SAFE = '0xAAA0000000000000000000000000000000000001';

describe('getServicesFromMarketplaceSubgraph', () => {
  // The mech-analytics counter path is default-ON (the API URL is built
  // in), so without an explicit override these subgraph-side tests would
  // silently route through ``fetchRequesterMetrics`` (unmocked → fails →
  // totalRequests = 0).
  // Pin the flag OFF at the outer describe; the inner
  // `mech-analytics counter branch` describe re-enables it in its
  // own beforeEach.
  const originalEnv = process.env;
  beforeEach(() => {
    process.env = { ...originalEnv, NEXT_PUBLIC_USE_MECH_ANALYTICS_ROWS: 'false' };
  });
  afterEach(() => {
    process.env = originalEnv;
  });

  describe('demand counter', () => {
    // The single most important invariant in this file: the on-chain handler bumps
    // totalLegacyRequests and totalMarketplaceRequests together, so summing them
    // doubles every on-chain request.
    it('uses totalLegacyRequests alone and never adds totalMarketplaceRequests', async () => {
      mockSubgraph({
        services: [{ id: '1', totalRequests: '0', latestMultisig: SAFE }],
        senders: [
          { id: SAFE.toLowerCase(), totalLegacyRequests: '100', totalMarketplaceRequests: '500' },
        ],
      });

      const [service] = await getServices();

      expect(service.totalRequests).toBe(100);
    });

    it('sums across latestMultisig and historicalMultisigs without double-counting a repeat', async () => {
      const older = '0xBBB0000000000000000000000000000000000002';
      mockSubgraph({
        services: [
          {
            id: '1',
            totalRequests: '0',
            latestMultisig: SAFE,
            // SAFE repeated: the dedupe must not count it twice.
            historicalMultisigs: [older, SAFE],
          },
        ],
        senders: [
          { id: SAFE.toLowerCase(), totalLegacyRequests: '7' },
          { id: older.toLowerCase(), totalLegacyRequests: '5' },
        ],
      });

      const [service] = await getServices();

      expect(service.totalRequests).toBe(12);
    });

    it('matches senders case-insensitively', async () => {
      mockSubgraph({
        services: [{ id: '1', totalRequests: '0', latestMultisig: SAFE }],
        // Subgraph returns lowercase; the service field is mixed case.
        senders: [{ id: SAFE.toLowerCase(), totalLegacyRequests: '42' }],
      });

      const [service] = await getServices();

      expect(service.totalRequests).toBe(42);
    });

    it('falls back to the legacy Service total when it is higher', async () => {
      mockSubgraph({
        services: [{ id: '1', totalRequests: '900', latestMultisig: SAFE }],
        senders: [{ id: SAFE.toLowerCase(), totalLegacyRequests: '10' }],
      });

      const [service] = await getServices();

      expect(service.totalRequests).toBe(900);
    });

    it('skips the sender query when no service has a multisig', async () => {
      mockSubgraph({
        services: [{ id: '1', totalRequests: '3', latestMultisig: null, historicalMultisigs: [] }],
      });

      const [service] = await getServices();

      expect(mockRequest).toHaveBeenCalledTimes(1);
      expect(service.totalRequests).toBe(3);
    });
  });

  describe('supply counter', () => {
    it('prefers the Mech counter when it is ahead of the frozen Service total', async () => {
      mockSubgraph({
        services: [{ id: '1', totalDeliveries: '4' }],
        meches: [{ id: '1', totalDeliveriesTransactions: '38' }],
      });

      const [service] = await getServices();

      expect(service.totalDeliveries).toBe(38);
    });

    // Legacy agent-mech services have no Mech row at all; without the max they
    // would drop to 0 and silently lose the Supply role.
    it('keeps the legacy Service total when the service has no Mech entity', async () => {
      mockSubgraph({
        services: [{ id: '1', totalDeliveries: '619' }],
        meches: [],
      });

      const [service] = await getServices();

      expect(service.totalDeliveries).toBe(619);
    });

    it('reports zero when neither source has a count', async () => {
      mockSubgraph({ services: [{ id: '1' }], meches: [] });

      const [service] = await getServices();

      expect(service.totalDeliveries).toBe(0);
      expect(service.totalRequests).toBe(0);
    });

    it('does not attribute one service’s Mech row to another', async () => {
      mockSubgraph({
        services: [{ id: '1', totalDeliveries: '0' }],
        meches: [{ id: '2', totalDeliveriesTransactions: '38' }],
      });

      const [service] = await getServices();

      expect(service.totalDeliveries).toBe(0);
    });
  });

  describe('passthrough fields', () => {
    it('flattens the first metadata entry and maps mech addresses', async () => {
      mockSubgraph({
        services: [
          {
            id: '1',
            metadata: [{ metadata: '0xdeadbeef' }],
            mechs: [
              { id: '0xa', address: '0xmech1' },
              { id: '0xb', address: '0xmech2' },
            ],
          },
        ],
      });

      const [service] = await getServices();

      expect(service.metadata).toBe('0xdeadbeef');
      expect(service.mechAddresses).toEqual(['0xmech1', '0xmech2']);
    });

    it('defaults metadata and mechAddresses when absent', async () => {
      mockSubgraph({ services: [{ id: '1' }] });

      const [service] = await getServices();

      expect(service.metadata).toBe('');
      expect(service.mechAddresses).toEqual([]);
    });

    // Both eras at once: a legacy MechAgent on service.mechs AND a marketplace
    // Mech row in `meches`. The union must keep both, deduped and lowercased.
    it('unions legacy service.mechs with the marketplace meches row', async () => {
      mockRequest.mockReset();
      mockRequest
        .mockResolvedValueOnce({
          services: [{ id: '1', mechs: [{ id: '0xa', address: '0xLegacyMech' }] }],
          meches: [{ id: '1', address: '0xMarketMech', totalDeliveriesTransactions: '2' }],
        })
        .mockRejectedValue(new Error('unexpected second request'));

      const [service] = await getServices();

      expect(service.mechAddresses).toEqual(['0xlegacymech', '0xmarketmech']);
      expect(service.totalDeliveries).toBe(2);
    });

    it('warns when the response has no `meches` field at all (schema drift)', async () => {
      mockRequest.mockReset();
      mockRequest
        .mockResolvedValueOnce({ services: [{ id: '1' }] })
        .mockRejectedValue(new Error('unexpected second request'));
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const [service] = await getServices();

      expect(service.mechAddresses).toEqual([]);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('no `meches` field'));
      warn.mockRestore();
    });
  });

  describe('getServiceEndpointsFromMarketplaceSubgraph', () => {
    it('passes the service id as a variable, so a hostile id cannot reshape the query', async () => {
      const hostile = '1") } mutation { x';
      mockRequest.mockReset();
      mockRequest.mockResolvedValueOnce({ service: null, mech: null });

      const result = await getServiceEndpointsFromMarketplaceSubgraph({
        chainId: 100,
        serviceId: hostile,
      });

      const [doc, variables] = mockRequest.mock.calls[0];
      expect(doc).not.toContain(hostile);
      expect(doc).toContain('service(id: $id)');
      expect(variables).toEqual({ id: hostile });
      expect(result).toEqual({ multisigs: [], mechAddresses: [] });
    });

    it('reads serviceById / mechById on the squid and unions the addresses', async () => {
      mockRequest.mockReset();
      mockRequest.mockResolvedValueOnce({
        serviceById: { id: '1', latestMultisig: SAFE, historicalMultisigs: null },
        mechById: { address: '0xMechOnRobinhood' },
      });

      const result = await getServiceEndpointsFromMarketplaceSubgraph({
        chainId: 4663,
        serviceId: '1',
      });

      const [doc, variables] = mockRequest.mock.calls[0];
      expect(doc).toContain('serviceById(id: $id)');
      expect(doc).toContain('mechById(id: $id)');
      expect(variables).toEqual({ id: '1' });
      expect(result).toEqual({
        multisigs: [SAFE.toLowerCase()],
        mechAddresses: ['0xmechonrobinhood'],
      });
    });
  });

  // Default-ON in production but was untested for five review rounds:
  // the mech-analytics counter path (fan-out via mapWithConcurrency,
  // per-multisig .catch(), shape guard, Math.max fallback).
  describe('mech-analytics counter branch', () => {
    const originalEnv = process.env;
    const originalFetch = global.fetch;

    const mockMechAnalyticsResponse = (body: unknown, ok = true, status = 200): Response =>
      ({
        ok,
        status,
        statusText: ok ? 'OK' : 'Server Error',
        json: async () => body,
      }) as unknown as Response;

    beforeEach(() => {
      process.env = {
        ...originalEnv,
        // The counter branch is gated on shouldUseMechAnalytics
        // returning true; the outer describe pins the flag off.
        NEXT_PUBLIC_USE_MECH_ANALYTICS_ROWS: 'true',
      };
    });

    afterEach(() => {
      process.env = originalEnv;
      global.fetch = originalFetch;
    });

    it('sums n_mech_requests across the service’s multisig union from mech-analytics', async () => {
      const SAFE_A = SAFE.toLowerCase();
      const SAFE_B = '0xbbb0000000000000000000000000000000000002';
      mockSubgraph({
        services: [
          {
            id: '1',
            latestMultisig: SAFE_A,
            historicalMultisigs: [SAFE_B],
            totalRequests: '0',
          },
        ],
      });
      // Each safe returns its own count; the fan-out sums to 130.
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce(
          mockMechAnalyticsResponse({
            address: SAFE_A,
            chain_id: 100,
            windows: { all: { n_mech_requests: 100, tool_accuracy: null } },
          }),
        )
        .mockResolvedValueOnce(
          mockMechAnalyticsResponse({
            address: SAFE_B.toLowerCase(),
            chain_id: 100,
            windows: { all: { n_mech_requests: 30, tool_accuracy: null } },
          }),
        );

      const [service] = await getServices();

      expect(service.totalRequests).toBe(130);
      // Sender counter round-trip is skipped on the mech-analytics
      // branch (senders response isn't consumed).
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('per-multisig 500 falls back to the subgraph legacy total via Math.max', async () => {
      const SAFE_A = SAFE.toLowerCase();
      mockSubgraph({
        services: [
          {
            id: '1',
            latestMultisig: SAFE_A,
            historicalMultisigs: null,
            // Legacy total says 42; mech-analytics fetch will fail.
            // Math.max preserves the 42 rather than dropping to 0.
            totalRequests: '42',
          },
        ],
      });
      global.fetch = jest.fn().mockResolvedValueOnce(mockMechAnalyticsResponse({}, false, 500));

      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const [service] = await getServices();

      expect(service.totalRequests).toBe(42);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('mech-analytics requester metrics failed'),
      );
      warn.mockRestore();
    });

    it('drifted response shape (missing windows.all) falls back rather than throwing', async () => {
      // The narrow-shape guard is what stops a renamed field from
      // 500-ing the whole route. Without it, `metrics.windows.all.
      // n_mech_requests` would throw on undefined.
      const SAFE_A = SAFE.toLowerCase();
      mockSubgraph({
        services: [
          {
            id: '1',
            latestMultisig: SAFE_A,
            historicalMultisigs: null,
            totalRequests: '7',
          },
        ],
      });
      global.fetch = jest.fn().mockResolvedValueOnce(
        mockMechAnalyticsResponse({
          address: SAFE_A,
          chain_id: 100,
          // ``windows`` renamed / missing → the guard falls back
          // without throwing.
          windows: {},
        }),
      );

      const [service] = await getServices();

      expect(service.totalRequests).toBe(7);
    });
  });

  describe('squid dialect (Robinhood, 4663)', () => {
    const getSquidServices = () =>
      getServicesFromMarketplaceSubgraph({ chainId: 4663, serviceIds: ['1'] });

    it('sends OpenReader paging and still reads the top-level `meches`', async () => {
      mockRequest.mockReset();
      mockRequest
        .mockResolvedValueOnce({
          services: [{ id: '1', totalDeliveries: '0', latestMultisig: SAFE }],
          meches: [{ id: '1', address: '0xMechOnRobinhood', totalDeliveriesTransactions: '3' }],
        })
        .mockResolvedValueOnce({ senders: [{ id: SAFE.toLowerCase(), totalLegacyRequests: '4' }] })
        .mockRejectedValue(new Error('unexpected third request'));

      const [service] = await getSquidServices();

      const [detailsQuery] = mockRequest.mock.calls[0];
      expect(detailsQuery).toContain('limit: 1000');
      expect(detailsQuery).not.toContain('first:');
      expect(detailsQuery).toContain('meches(');
      expect(detailsQuery).not.toContain('mechs { id address }');
      const [sendersQuery] = mockRequest.mock.calls[1];
      expect(sendersQuery).toContain('limit: 1000');

      expect(service.totalDeliveries).toBe(3);
      expect(service.totalRequests).toBe(4);
      expect(service.mechAddresses).toEqual(['0xmechonrobinhood']);
    });

    it('reports zero deliveries and no mech address when the squid has no Mech row', async () => {
      mockRequest.mockReset();
      mockRequest
        .mockResolvedValueOnce({ services: [{ id: '1' }], meches: [] })
        .mockRejectedValue(new Error('unexpected second request'));

      const [service] = await getSquidServices();

      expect(service.totalDeliveries).toBe(0);
      expect(service.mechAddresses).toEqual([]);
    });
  });
});
