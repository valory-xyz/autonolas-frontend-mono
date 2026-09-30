/**
 * @jest-environment node
 */
const ENV_KEYS = [
  'NEXT_PUBLIC_OLAS_POLYMARKET_AGENTS_SQUID_URL',
  'PREDICT_OMEN_URL',
  'THEGRAPH_API_KEY',
] as const;

const loadClientModule = () => {
  let clientModule: typeof import('./client') | undefined;
  jest.isolateModules(() => {
    clientModule = jest.requireActual<typeof import('./client')>('./client');
  });
  return clientModule as typeof import('./client');
};

describe('graphql clients', () => {
  beforeEach(() => ENV_KEYS.forEach((key) => delete process.env[key]));

  it('imports without any variable set', () => {
    expect(loadClientModule).not.toThrow();
  });

  it('throws only when a client is used without its required URL', () => {
    const { getPredictPolymarketClient, getPredictOmenClient } = loadClientModule();

    expect(getPredictPolymarketClient).toThrow('NEXT_PUBLIC_OLAS_POLYMARKET_AGENTS_SQUID_URL');
    expect(getPredictOmenClient).toThrow('PREDICT_OMEN_URL');
  });

  it('builds each agent client once its URL is set', () => {
    process.env.NEXT_PUBLIC_OLAS_POLYMARKET_AGENTS_SQUID_URL = 'https://squid.example/graphql';

    expect(loadClientModule().getPredictPolymarketClient()).toBeDefined();

    process.env.PREDICT_OMEN_URL = 'https://omen.example/graphql';
    const { getPredictOmenClient } = loadClientModule();
    expect(getPredictOmenClient()).toBeDefined();
    expect(getPredictOmenClient()).toBe(getPredictOmenClient());
  });

  it('builds a thumbnail client only with a Graph API key', () => {
    expect(loadClientModule().getOmenThumbnailClient()).toBeNull();

    process.env.THEGRAPH_API_KEY = 'key';
    expect(loadClientModule().getOmenThumbnailClient()).not.toBeNull();
  });

  it('bounds every request with a timeout signal', async () => {
    process.env.PREDICT_OMEN_URL = 'https://omen.example/graphql';
    const signal = new AbortController().signal;
    const timeoutSpy = jest.spyOn(AbortSignal, 'timeout').mockReturnValue(signal);
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(Response.json({ data: { x: 1 } }));

    await loadClientModule().getPredictOmenClient().request('{ x }');

    expect(timeoutSpy).toHaveBeenCalledWith(10_000);
    expect(fetchSpy.mock.calls[0][1]?.signal).toBe(signal);
    jest.restoreAllMocks();
  });
});
