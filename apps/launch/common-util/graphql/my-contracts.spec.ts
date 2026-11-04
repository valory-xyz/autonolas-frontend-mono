import { base, gnosis } from 'viem/chains';

const mockRequest = jest.fn();

jest.mock('graphql-request', () => ({
  gql: (strings: TemplateStringsArray, ...values: unknown[]) => String.raw(strings, ...values),
  GraphQLClient: jest.fn().mockImplementation((url: string) => ({
    request: (query: string, variables: unknown) => mockRequest(url, query, variables),
  })),
}));

const SQUID_URL = 'https://squid.test/staking-base/graphql';
const GNOSIS_URL = 'https://graph.test/staking-gnosis';
const SENDER = '0x00000000000000000000000000000000000000AA';

process.env.NEXT_PUBLIC_STAKING_BASE_SQUID_URL = SQUID_URL;
process.env.NEXT_PUBLIC_GNOSIS_STAKING_SUBGRAPH_URL = GNOSIS_URL;

// Loaded after the env is set: the clients read their URLs on load.
const { getStakingContractsBySender } =
  jest.requireActual<typeof import('./my-contracts')>('./my-contracts');

describe('getStakingContractsBySender', () => {
  beforeEach(() => {
    mockRequest.mockReset();
    mockRequest.mockResolvedValue({ stakingContracts: [] });
  });

  it('reads Base from the squid with an OpenReader query, in the Graph order', async () => {
    await getStakingContractsBySender({ chain: base.id, senderId: SENDER });

    const [url, query, variables] = mockRequest.mock.calls[0];
    expect(url).toBe(SQUID_URL);
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
