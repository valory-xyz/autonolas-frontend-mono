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
const SENDER = '0x00000000000000000000000000000000000000AA';

process.env.NEXT_PUBLIC_STAKING_BASE_SQUID_URL = SQUID_URL;
process.env.NEXT_PUBLIC_STAKING_POLYGON_SQUID_URL = POLYGON_SQUID_URL;
process.env.NEXT_PUBLIC_GNOSIS_STAKING_SUBGRAPH_URL = GNOSIS_URL;

// Loaded after the env is set: the clients read their URLs on load.
const { getStakingContractsBySender } =
  jest.requireActual<typeof import('./my-contracts')>('./my-contracts');

describe('getStakingContractsBySender', () => {
  beforeEach(() => {
    mockRequest.mockReset();
    mockRequest.mockResolvedValue({ stakingContracts: [] });
  });

  it.each([
    [base.id, SQUID_URL],
    [polygon.id, POLYGON_SQUID_URL],
  ] as const)('reads %s from its squid in the Graph order', async (chainId, squidUrl) => {
    await getStakingContractsBySender({ chain: chainId, senderId: SENDER });

    const [url, query, variables] = mockRequest.mock.calls[0];
    expect(url).toBe(squidUrl);
    expect(query).toContain('$sender: String!');
    expect(query).toContain('stakingContracts(where: { sender_eq: $sender }, orderBy: id_ASC)');
    expect(query).toContain('activityChecker');
    expect(variables).toEqual({ sender: SENDER.toLowerCase() });
  });

  it('keeps the Graph query on other chains', async () => {
    await getStakingContractsBySender({ chain: gnosis.id, senderId: SENDER });

    const [url, query, variables] = mockRequest.mock.calls[0];
    expect(url).toBe(GNOSIS_URL);
    expect(query).toContain('$sender: Bytes!');
    expect(query).toContain('stakingContracts(where: { sender: $sender })');
    expect(query).toContain('activityChecker');
    expect(variables).toEqual({ sender: SENDER.toLowerCase() });
  });
});
