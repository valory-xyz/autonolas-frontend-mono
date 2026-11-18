import { base, gnosis, polygon } from 'viem/chains';

const mockRequest = jest.fn();

jest.mock('graphql-request', () => ({
  gql: (strings: TemplateStringsArray, ...values: unknown[]) => String.raw(strings, ...values),
  GraphQLClient: jest.fn().mockImplementation((url: string) => ({
    request: (query: string, variables: unknown) => mockRequest(url, query, variables),
  })),
}));

const SQUID_URL = 'https://squid.test/staking-base/graphql';
const POLYGON_SQUID_URL = 'https://squid.test/staking-polygon/graphql';
const GNOSIS_URL = 'https://graph.test/staking-gnosis';
const ADDRESS = '0x00000000000000000000000000000000000000AA';
const LOWERCASE_ADDRESS = ADDRESS.toLowerCase();

/** The clients read their URLs on load, so each case loads a fresh copy after setting the env. */
const loadModule = () => {
  let loaded: typeof import('./index') | undefined;
  jest.isolateModules(() => {
    loaded = jest.requireActual<typeof import('./index')>('./index');
  });
  return loaded as typeof import('./index');
};

describe('fetchStakingDataFromSubgraph', () => {
  const contract = {
    id: LOWERCASE_ADDRESS,
    maxNumServices: '10',
    rewardsPerSecond: '1',
    minStakingDeposit: '2',
    numAgentInstances: '1',
    agentIds: ['1'],
  };

  beforeEach(() => {
    process.env.NEXT_PUBLIC_STAKING_BASE_SQUID_URL = SQUID_URL;
    process.env.NEXT_PUBLIC_STAKING_POLYGON_SQUID_URL = POLYGON_SQUID_URL;
    process.env.NEXT_PUBLIC_GNOSIS_STAKING_SUBGRAPH_URL = GNOSIS_URL;
    mockRequest.mockReset();
    mockRequest.mockImplementation(async (_url: string, query: string) =>
      query.includes('stakingContracts')
        ? { stakingContracts: [contract] }
        : { cp0: [{ availableRewards: '7' }] },
    );
  });

  it.each([
    [base.id, SQUID_URL],
    [polygon.id, POLYGON_SQUID_URL],
  ])('reads %s from its squid', async (chainId, url) => {
    const { fetchStakingDataFromSubgraph } = loadModule();

    const rows = await fetchStakingDataFromSubgraph(Number(chainId), [ADDRESS]);

    const [contractsCall, checkpointsCall] = mockRequest.mock.calls;
    expect(contractsCall[0]).toBe(url);
    expect(contractsCall[1]).toContain('$ids: [String!]!');
    expect(contractsCall[2]).toEqual({ ids: [LOWERCASE_ADDRESS] });
    expect(checkpointsCall[0]).toBe(url);
    expect(checkpointsCall[1]).toContain('$addr0: String!');
    expect(checkpointsCall[1]).toContain(
      'checkpoints(where: { contractAddress_eq: $addr0 }, orderBy: [blockTimestamp_DESC, id_DESC], limit: 1)',
    );
    expect(rows.get(LOWERCASE_ADDRESS)).toEqual({
      maxNumServices: 10,
      rewardsPerSecond: '1',
      minStakingDeposit: '2',
      numAgentInstances: '1',
      availableRewards: '7',
    });
  });

  it('keeps Graph queries on other chains', async () => {
    const { fetchStakingDataFromSubgraph } = loadModule();

    await fetchStakingDataFromSubgraph(gnosis.id, [ADDRESS]);

    const [contractsCall, checkpointsCall] = mockRequest.mock.calls;
    expect(contractsCall[0]).toBe(GNOSIS_URL);
    expect(contractsCall[1]).toContain('$ids: [Bytes!]!');
    expect(checkpointsCall[0]).toBe(GNOSIS_URL);
    expect(checkpointsCall[1]).toContain('$addr0: Bytes!');
    expect(checkpointsCall[1]).toContain(
      'checkpoints(where: { contractAddress: $addr0 }, orderBy: blockTimestamp, orderDirection: desc, first: 1)',
    );
  });

  it('reports Base as unsupported, so reads fall back to RPC, when the squid URL is unset', () => {
    delete process.env.NEXT_PUBLIC_STAKING_BASE_SQUID_URL;

    const { hasSubgraphSupport } = loadModule();

    expect(hasSubgraphSupport(base.id)).toBe(false);
  });
});
