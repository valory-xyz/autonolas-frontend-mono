import { getServicesFromMarketplaceSubgraph } from 'common-util/graphql/services';

const mockRequest = jest.fn();

jest.mock('common-util/graphql/index', () => ({
  MARKETPLACE_SUBGRAPH_CLIENTS: {
    100: {
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
  });

  // Default-ON in production but was untested for five review rounds:
  // the mech-analytics counter path (fan-out via mapWithConcurrency,
  // per-multisig .catch(), shape guard, Math.max fallback).
  describe('mech-analytics counter branch', () => {
    const originalEnv = process.env;
    const originalFetch = global.fetch;
    const MECH_ANALYTICS_URL = 'https://ma.example';

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
        NEXT_PUBLIC_MECH_ANALYTICS_URL: MECH_ANALYTICS_URL,
        // The counter branch is gated on shouldUseMechAnalytics
        // returning true. Config also requires the URL to be set.
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
});
