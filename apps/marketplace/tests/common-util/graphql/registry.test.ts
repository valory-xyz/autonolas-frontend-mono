import { getServiceFromRegistry } from 'common-util/graphql/registry';

const mockGraphRequest = jest.fn();
const mockSquidRequest = jest.fn();

jest.mock('common-util/graphql/index', () => ({
  REGISTRY_SUBGRAPH_CLIENTS: {
    100: {
      get request() {
        return mockGraphRequest;
      },
    },
    4663: {
      get request() {
        return mockSquidRequest;
      },
    },
  },
}));

const ROW = { id: '1', multisig: '0xsafe', erc8004Agent: { id: '256', agentWallet: '0xsafe' } };

describe('getServiceFromRegistry', () => {
  beforeEach(() => {
    mockGraphRequest.mockReset();
    mockSquidRequest.mockReset();
  });

  it('reads `service` from a Graph response', async () => {
    mockGraphRequest.mockResolvedValueOnce({ service: ROW });
    const service = await getServiceFromRegistry({ chainId: 100, id: '1' });
    expect(service).toEqual(ROW);
    const [doc, variables] = mockGraphRequest.mock.calls[0];
    expect(String(doc)).toContain('service(id: $id)');
    expect(variables).toEqual({ id: '1' });
  });

  it('reads `serviceById` from a squid response', async () => {
    mockSquidRequest.mockResolvedValueOnce({ serviceById: ROW });
    const service = await getServiceFromRegistry({ chainId: 4663, id: '1' });
    expect(service).toEqual(ROW);
    expect(String(mockSquidRequest.mock.calls[0][0])).toContain('serviceById(id: $id)');
  });

  it('returns null when the squid has no such service', async () => {
    mockSquidRequest.mockResolvedValueOnce({ serviceById: null });
    expect(await getServiceFromRegistry({ chainId: 4663, id: '999' })).toBeNull();
  });
});
