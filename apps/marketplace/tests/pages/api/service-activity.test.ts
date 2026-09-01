import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '../../../pages/api/service-activity';

jest.mock('common-util/graphql/service-activity', () => ({
  getServiceActivityFromMarketplaceSubgraph: jest.fn(),
}));
jest.mock('common-util/graphql/services', () => ({
  getServiceEndpointsFromMarketplaceSubgraph: jest.fn(),
}));
jest.mock('common-util/mechAnalytics/service-activity', () => ({
  getServiceActivityFromMechAnalytics: jest.fn(),
}));
jest.mock('common-util/mechAnalytics/config', () => ({
  shouldUseMechAnalytics: jest.fn(),
}));

const { getServiceActivityFromMarketplaceSubgraph } = jest.requireMock(
  'common-util/graphql/service-activity',
) as {
  getServiceActivityFromMarketplaceSubgraph: jest.Mock;
};
const { getServiceEndpointsFromMarketplaceSubgraph } = jest.requireMock(
  'common-util/graphql/services',
) as {
  getServiceEndpointsFromMarketplaceSubgraph: jest.Mock;
};
const { getServiceActivityFromMechAnalytics } = jest.requireMock(
  'common-util/mechAnalytics/service-activity',
) as {
  getServiceActivityFromMechAnalytics: jest.Mock;
};
const { shouldUseMechAnalytics } = jest.requireMock('common-util/mechAnalytics/config') as {
  shouldUseMechAnalytics: jest.Mock;
};

type MockRes = {
  status: jest.Mock;
  json: jest.Mock;
  setHeader: jest.Mock;
  headers: Record<string, string>;
};

const makeRes = (): MockRes => {
  const headers: Record<string, string> = {};
  const res: MockRes = {
    status: jest.fn().mockReturnThis() as jest.Mock,
    json: jest.fn().mockReturnThis() as jest.Mock,
    setHeader: jest.fn((k: string, v: string) => {
      headers[k] = v;
    }) as jest.Mock,
    headers,
  };
  return res;
};

const call = async (query: Record<string, string>, method = 'GET'): Promise<MockRes> => {
  const req = { method, query } as unknown as NextApiRequest;
  const res = makeRes();
  await handler(req, res as unknown as NextApiResponse);
  return res;
};

beforeEach(() => {
  getServiceActivityFromMarketplaceSubgraph.mockReset();
  getServiceEndpointsFromMarketplaceSubgraph.mockReset();
  getServiceActivityFromMechAnalytics.mockReset();
  shouldUseMechAnalytics.mockReset();
  // Default: flag on, no degraded, no error.
  shouldUseMechAnalytics.mockReturnValue(true);
  getServiceEndpointsFromMarketplaceSubgraph.mockResolvedValue({
    multisigs: ['0x' + '11'.repeat(20)],
    mechAddresses: ['0x' + '22'.repeat(20)],
  });
  getServiceActivityFromMarketplaceSubgraph.mockResolvedValue({ activities: [] });
  getServiceActivityFromMechAnalytics.mockResolvedValue({
    id: '1',
    activities: [],
    hasMore: false,
    degraded: false,
  });
});

describe('GET /api/service-activity — input validation', () => {
  it('rejects non-GET methods with 405', async () => {
    const res = await call({ chainId: '100', serviceId: '1' }, 'POST');
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('rejects missing serviceId with 400', async () => {
    const res = await call({ chainId: '100' });
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('rejects non-numeric serviceId with 400 (GraphQL injection guard)', async () => {
    const res = await call({ chainId: '100', serviceId: '1") { id } #' });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid serviceId' });
  });

  it('rejects unsupported network with 400', async () => {
    const res = await call({ chainId: '99999', serviceId: '1' });
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('GET /api/service-activity — cache TTL', () => {
  it('serves normal 1h + 1h SWR on a healthy response', async () => {
    const res = await call({ chainId: '100', serviceId: '1' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.headers['Cache-Control']).toContain('s-maxage=3600');
    expect(res.headers['Cache-Control']).toContain('stale-while-revalidate=3600');
  });

  it('shortens Cache-Control to s-maxage=60 (no SWR) when degraded', async () => {
    getServiceActivityFromMechAnalytics.mockResolvedValue({
      id: '1',
      activities: [],
      hasMore: false,
      degraded: true,
    });
    const res = await call({ chainId: '100', serviceId: '1' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.headers['Cache-Control']).toBe('public, s-maxage=60');
  });

  it('disables cache when latest=true (force fresh)', async () => {
    const res = await call({ chainId: '100', serviceId: '1', latest: 'true' });
    expect(res.headers['Cache-Control']).toContain('no-cache');
  });
});

describe('GET /api/service-activity — subgraph blip degrades the response (F22)', () => {
  it('marks the response degraded=true when the subgraph activity fetch fails', async () => {
    getServiceActivityFromMarketplaceSubgraph.mockRejectedValueOnce(new Error('subgraph down'));
    // mech-analytics itself returns clean.
    getServiceActivityFromMechAnalytics.mockResolvedValue({
      id: '1',
      activities: [],
      hasMore: false,
      degraded: false,
    });

    const res = await call({ chainId: '100', serviceId: '1' });

    expect(res.status).toHaveBeenCalledWith(200);
    // The 60s TTL branch fires on either failure source.
    expect(res.headers['Cache-Control']).toBe('public, s-maxage=60');
    const body = res.json.mock.calls[0][0] as {
      services: { degraded?: boolean };
    };
    expect(body.services.degraded).toBe(true);
  });
});

describe('GET /api/service-activity — endpoint lookup 500', () => {
  it('endpoint lookup failure propagates to 500 (no multisigs → cannot fan out)', async () => {
    getServiceEndpointsFromMarketplaceSubgraph.mockRejectedValueOnce(new Error('subgraph down'));
    const res = await call({ chainId: '100', serviceId: '1' });
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
