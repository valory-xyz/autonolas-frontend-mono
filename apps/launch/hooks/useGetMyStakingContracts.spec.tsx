import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { ReactNode, useLayoutEffect } from 'react';
import { Provider } from 'react-redux';
import { useAccount, usePublicClient, useReadContract, useReadContracts } from 'wagmi';

import { LOGS_MAX_BLOCK_SPAN, blockNumbers } from 'common-util/constants/stakingContract';
import { hasSubgraphSupport } from 'common-util/graphql/my-contracts';
import { seedStakingContractMetadata } from 'common-util/queries/myStakingContracts';
import { useAppSelector } from 'store/index';
import {
  launchReducer,
  recordConfirmedNomination,
  recordCreatedStakingContract,
} from 'store/launch';
import { networkReducer, setNetworkDetails } from 'store/network';
import { MyStakingContract } from 'types/index';

import { useGetMyStakingContracts } from './useGetMyStakingContracts';
import { useMyStakingContracts, useRetryMyStakingContracts } from './useMyStakingContracts';
import { useNominees } from './useNominees';

const ROBINHOOD = 4663;
const GNOSIS = 100;
const ACCOUNT_A = '0x00000000000000000000000000000000000000AA';
const ACCOUNT_B = '0x00000000000000000000000000000000000000BB';
const CONTRACT_A = '0x000000000000000000000000000000000000A001';
const CONTRACT_B = '0x000000000000000000000000000000000000B001';
const HASH_A = `0x${'a'.repeat(64)}`;
const HASH_B = `0x${'b'.repeat(64)}`;
const HASHES: Record<string, string> = {
  [CONTRACT_A]: HASH_A,
  [CONTRACT_B]: HASH_B,
};

jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
  usePublicClient: jest.fn(),
  useReadContract: jest.fn(),
  useReadContracts: jest.fn(),
}));
jest.mock('common-util/graphql/my-contracts', () => ({
  hasSubgraphSupport: jest.fn(() => true),
}));
jest.mock('common-util/constants/stakingContract', () => ({
  blockNumbers: {},
  LOGS_MAX_BLOCK_SPAN: {},
  CONTRACT_TEMPLATES: [{ title: 'Template' }],
}));
jest.mock('libs/util-constants/src', () => ({
  GATEWAY_URL: 'https://gateway.test/ipfs/',
  HASH_PREFIX: 'f01701220',
}));
jest.mock('libs/util-contracts/src/lib/abiAndAddresses', () => ({
  STAKING_FACTORY: { addresses: {} },
  STAKING_TOKEN: { abi: [] },
  VOTE_WEIGHTING: {
    addresses: { 1: '0x0000000000000000000000000000000000000001' },
    abi: [],
  },
}));
// Same result as ethers.zeroPadValue(address, 32), without loading ethers.
jest.mock('libs/util-functions/src', () => ({
  getBytes32FromAddress: (address: string) =>
    `0x${address.slice(2).toLowerCase().padStart(64, '0')}`,
}));

type Metadata = { name: string; description: string };
type Lookup = string[] | 'fail' | Promise<string[]>;
type NomineeRow = { account: string; chainId: bigint };
type NomineeSource = NomineeRow[] | 'fail' | Promise<NomineeRow[]>;

const bytes32 = (address: string) => `0x${address.slice(2).toLowerCase().padStart(64, '0')}`;

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

let lookups: Record<string, Lookup>;
let ipfs: Record<string, Metadata | Promise<Metadata> | 'unavailable'>;
let ipfsFetches: string[];
let contractReads: string[];
// metadataHash reads still to fail, per contract.
let hashFailures: Record<string, number>;
let nomineeSource: NomineeSource;
let nomineeReads: number;

/** `/api/my-contracts` per `chainId:account`, and the IPFS gateway per metadata hash. */
const installFetch = () => {
  global.fetch = jest.fn(async (input: string) => {
    if (input.startsWith('https://gateway.test/ipfs/f01701220')) {
      const hash = `0x${input.slice('https://gateway.test/ipfs/f01701220'.length)}`;
      ipfsFetches.push(hash);
      const metadata = await ipfs[hash];
      if (metadata === 'unavailable') return { ok: false, status: 503 };
      return { ok: true, json: async () => metadata };
    }
    const params = new URL(input, 'http://launch.test').searchParams;
    const lookup = lookups[`${params.get('chainId')}:${params.get('address')}`];
    if (lookup === undefined || lookup === 'fail') return { ok: false, status: 500 };
    const instances = await lookup;
    return {
      ok: true,
      json: async () => ({
        stakingContracts: instances.map((instance) => ({ instance })),
      }),
    };
  }) as unknown as typeof fetch;
};

type Commit = {
  chainId: number | null;
  account: string | undefined;
  isLoading: boolean;
  isLookupFailed: boolean;
  contracts: MyStakingContract[];
};

/** Let queries, effects and timers settle, so a fetch loop would show up as extra calls. */
const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

const makeStore = () =>
  configureStore({
    reducer: { launch: launchReducer, network: networkReducer },
  });

describe('useGetMyStakingContracts', () => {
  let account: string | undefined;
  let queryClient: QueryClient;
  let store: ReturnType<typeof makeStore>;
  let commits: Commit[];

  const setNetwork = (networkId: number) =>
    act(() => {
      store.dispatch(
        setNetworkDetails({
          networkId,
          networkName: `n${networkId}`,
          networkDisplayName: '',
        }),
      );
    });

  /**
   * The publisher plus a consumer, as in the app (DataProvider + a page). Every committed render
   * records what the consumer would show and for which chain and account.
   */
  const render = () =>
    renderHook(
      () => {
        useGetMyStakingContracts();
        const view = useMyStakingContracts();
        const retry = useRetryMyStakingContracts();
        const nominees = useNominees();
        const { networkId } = useAppSelector((state) => state.network);
        const { address } = useAccount();
        useLayoutEffect(() => {
          commits.push({
            chainId: networkId,
            account: address,
            isLoading: view.isMyStakingContractsLoading,
            isLookupFailed: view.isMyStakingContractsLookupFailed,
            contracts: view.myStakingContracts,
          });
        });
        return { view, nominees, retry };
      },
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <Provider store={store}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
          </Provider>
        ),
      },
    );

  const shown = () => commits[commits.length - 1];
  const shownIds = () => shown().contracts.map(({ id }) => id);
  const statusOf = (id: string) =>
    shown().contracts.find((contract) => contract.id === id)?.nominationStatus;
  const waitForShown = (ids: string[], timeout?: number) =>
    waitFor(
      () => {
        expect(shown().isLoading).toBe(false);
        expect(shownIds()).toEqual(ids);
      },
      { timeout },
    );

  /** No committed render may show contracts outside what that chain and account own. */
  const expectEveryCommitOwned = (owned: Record<string, string[]>) => {
    const foreign = commits.flatMap((commit) => {
      const owner = `${commit.chainId}:${commit.account}`;
      const allowed = owned[owner] ?? [];
      return commit.contracts
        .filter(({ id, chainId }) => !allowed.includes(id) || chainId !== commit.chainId)
        .map(({ id }) => `${id} shown to ${owner}`);
    });
    expect(foreign).toEqual([]);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(window.console, 'warn').mockImplementation(() => undefined);
    jest.spyOn(window.console, 'error').mockImplementation(() => undefined);
    // The app's QueryClient defaults (context/Web3ModalProvider.tsx): nothing goes stale or is
    // garbage-collected unless a query says otherwise.
    queryClient = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, gcTime: Infinity } },
    });
    store = makeStore();
    store.dispatch(
      setNetworkDetails({
        networkId: ROBINHOOD,
        networkName: 'robinhood',
        networkDisplayName: '',
      }),
    );
    commits = [];
    account = ACCOUNT_A;
    lookups = {};
    ipfs = {
      [HASH_A]: { name: 'A', description: 'a' },
      [HASH_B]: { name: 'B', description: 'b' },
    };
    ipfsFetches = [];
    contractReads = [];
    hashFailures = {};
    nomineeSource = [];
    nomineeReads = 0;
    installFetch();

    (useAccount as jest.Mock).mockImplementation(() => ({ address: account }));
    const client = {
      getBlockNumber: jest.fn().mockResolvedValue(BigInt(100)),
      getLogs: jest.fn().mockRejectedValue(new Error('rpc unavailable')),
    };
    (usePublicClient as jest.Mock).mockReturnValue(client);
    // Real TanStack Query behind wagmi's hooks, passing the caller's options (including any
    // `select`) through, so render-driven refetching shows up as it would in the app. As in
    // wagmi (allowFailure), a failed read is an entry of a successful batch, and the result
    // carries its query key.
    (useReadContracts as jest.Mock).mockImplementation(
      ({
        contracts,
        query,
      }: {
        contracts: { address: string; chainId: number }[];
        query?: Record<string, unknown>;
      }) => {
        const queryKey = ['readContracts', contracts.map((c) => `${c.chainId}:${c.address}`)];
        const result = useQuery({
          ...query,
          queryKey,
          queryFn: async () =>
            contracts.map(({ address, chainId }) => {
              contractReads.push(`${chainId}:${address}`);
              if (hashFailures[address]) {
                hashFailures[address] -= 1;
                return {
                  status: 'failure',
                  error: new Error('rpc unavailable'),
                  result: undefined,
                };
              }
              return { status: 'success', result: HASHES[address] };
            }),
        });
        return { ...result, queryKey };
      },
    );
    // The mainnet nominee read. wagmi keeps TanStack's default of 3 retries; only the delay
    // between them (1s, 2s, 4s in the app) is shortened here.
    (useReadContract as jest.Mock).mockImplementation(
      ({ functionName, query }: { functionName: string; query?: Record<string, unknown> }) =>
        useQuery({
          ...query,
          queryKey: ['readContract', functionName],
          queryFn: async () => {
            nomineeReads += 1;
            const source = await nomineeSource;
            if (source === 'fail') throw new Error('mainnet rpc unavailable');
            return source;
          },
          retryDelay: 1,
        }),
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    queryClient.clear();
  });

  it('fetches each contract’s metadata from IPFS once', async () => {
    lookups[`${ROBINHOOD}:${ACCOUNT_A}`] = [CONTRACT_A];

    render();
    await waitForShown([CONTRACT_A]);
    await settle();

    expect(ipfsFetches).toEqual([HASH_A]);
    expect(contractReads).toEqual([`${ROBINHOOD}:${CONTRACT_A}`]);
  });

  it('commits loading, never an empty “loaded” list, until the first lookup finishes', async () => {
    const lookupA = deferred<string[]>();
    lookups[`${ROBINHOOD}:${ACCOUNT_A}`] = lookupA.promise;

    render();
    await settle();
    expect(commits.every(({ isLoading }) => isLoading)).toBe(true);

    await act(async () => lookupA.resolve([CONTRACT_A]));
    await waitForShown([CONTRACT_A]);
  });

  it('never commits the previous account’s contracts after an account switch', async () => {
    const lookupB = deferred<string[]>();
    lookups[`${ROBINHOOD}:${ACCOUNT_A}`] = [CONTRACT_A];
    lookups[`${ROBINHOOD}:${ACCOUNT_B}`] = lookupB.promise;

    const { rerender } = render();
    await waitForShown([CONTRACT_A]);
    const switchedAt = commits.length;

    account = ACCOUNT_B;
    rerender();
    await settle();

    // Including the very first commit with account B, before any effect has run.
    expect(commits[switchedAt]).toMatchObject({
      account: ACCOUNT_B,
      isLoading: true,
    });
    expect(commits.slice(switchedAt).every(({ isLoading }) => isLoading)).toBe(true);

    await act(async () => lookupB.resolve([CONTRACT_B]));
    await waitForShown([CONTRACT_B]);
    expectEveryCommitOwned({
      [`${ROBINHOOD}:${ACCOUNT_A}`]: [CONTRACT_A],
      [`${ROBINHOOD}:${ACCOUNT_B}`]: [CONTRACT_B],
    });
  });

  it('reports a failed lookup after retrying it, never as “no contracts”, and recovers on retry', async () => {
    lookups[`${ROBINHOOD}:${ACCOUNT_A}`] = [CONTRACT_A];
    lookups[`${ROBINHOOD}:${ACCOUNT_B}`] = 'fail';
    const lookupCalls = () =>
      (global.fetch as jest.Mock).mock.calls.filter(([url]) =>
        String(url).includes(`address=${ACCOUNT_B}`),
      ).length;

    const { result, rerender } = render();
    await waitForShown([CONTRACT_A]);

    account = ACCOUNT_B;
    rerender();

    await waitFor(() => expect(shown().isLookupFailed).toBe(true), { timeout: 8000 });
    // The first attempt and two retries, each trying the squid route and then the logs.
    expect(lookupCalls()).toBe(3);
    expect(shown().isLoading).toBe(false);
    expect(shownIds()).toEqual([]);
    // No committed render presented B's failed lookup as a loaded, empty list.
    expect(
      commits.filter((c) => c.account === ACCOUNT_B && !c.isLoading && !c.isLookupFailed),
    ).toEqual([]);
    expectEveryCommitOwned({ [`${ROBINHOOD}:${ACCOUNT_A}`]: [CONTRACT_A] });
    expect(store.getState().launch.myStakingContractsOwner).toEqual({
      chainId: ROBINHOOD,
      account: ACCOUNT_B.toLowerCase(),
    });

    // The page's Retry button.
    lookups[`${ROBINHOOD}:${ACCOUNT_B}`] = [CONTRACT_B];
    await act(async () => {
      await result.current.retry.retry();
    });
    await waitForShown([CONTRACT_B]);
    expect(shown().isLookupFailed).toBe(false);
  }, 15000);

  it('never reads or commits the previous chain’s contracts on the new chain', async () => {
    lookups[`${ROBINHOOD}:${ACCOUNT_A}`] = [CONTRACT_A];
    lookups[`${GNOSIS}:${ACCOUNT_A}`] = deferred<string[]>().promise;

    render();
    await waitForShown([CONTRACT_A]);
    const switchedAt = commits.length;

    setNetwork(GNOSIS);
    await settle();

    expect(contractReads).not.toContain(`${GNOSIS}:${CONTRACT_A}`);
    expect(commits[switchedAt]).toMatchObject({
      chainId: GNOSIS,
      isLoading: true,
    });
    expectEveryCommitOwned({ [`${ROBINHOOD}:${ACCOUNT_A}`]: [CONTRACT_A] });
  });

  it('never commits another account’s list when switching between cached accounts', async () => {
    lookups[`${ROBINHOOD}:${ACCOUNT_A}`] = [CONTRACT_A];
    lookups[`${ROBINHOOD}:${ACCOUNT_B}`] = [CONTRACT_B];

    const { rerender } = render();
    await waitForShown([CONTRACT_A]);
    account = ACCOUNT_B;
    rerender();
    await waitForShown([CONTRACT_B]);

    // Both lists are cached now; switching back must not show B's list under A, even briefly.
    account = ACCOUNT_A;
    rerender();
    await waitForShown([CONTRACT_A]);

    expectEveryCommitOwned({
      [`${ROBINHOOD}:${ACCOUNT_A}`]: [CONTRACT_A],
      [`${ROBINHOOD}:${ACCOUNT_B}`]: [CONTRACT_B],
    });
    expect(store.getState().launch.myStakingContractsOwner).toEqual({
      chainId: ROBINHOOD,
      account: ACCOUNT_A.toLowerCase(),
    });
  });

  it('never labels the current contracts with metadata from an older, slower request', async () => {
    const metadataA = deferred<Metadata>();
    ipfs[HASH_A] = metadataA.promise;
    lookups[`${ROBINHOOD}:${ACCOUNT_A}`] = [CONTRACT_A];
    lookups[`${ROBINHOOD}:${ACCOUNT_B}`] = [CONTRACT_B];

    const { rerender } = render();
    await waitFor(() => expect(ipfsFetches).toContain(HASH_A));

    account = ACCOUNT_B;
    rerender();
    await waitForShown([CONTRACT_B]);

    // A's IPFS response lands late.
    await act(async () => metadataA.resolve({ name: 'A', description: 'a' }));
    await settle();

    expect(shown().contracts).toEqual([expect.objectContaining({ id: CONTRACT_B, name: 'B' })]);
    commits.forEach(({ contracts }) =>
      expect(contracts).not.toContainEqual(expect.objectContaining({ id: CONTRACT_B, name: 'A' })),
    );
  });

  it('looks a chain and account up again when the user comes back to them', async () => {
    lookups[`${ROBINHOOD}:${ACCOUNT_A}`] = [CONTRACT_A];
    lookups[`${GNOSIS}:${ACCOUNT_A}`] = [];

    render();
    await waitForShown([CONTRACT_A]);

    // B was created elsewhere (another tab, a script); the backend returns it now.
    lookups[`${ROBINHOOD}:${ACCOUNT_A}`] = [CONTRACT_A, CONTRACT_B];
    setNetwork(GNOSIS);
    await waitForShown([]);

    setNetwork(ROBINHOOD);
    await waitForShown([CONTRACT_A, CONTRACT_B]);
    const lookupsOfA = (global.fetch as jest.Mock).mock.calls.filter(([url]) =>
      String(url).includes(`chainId=${ROBINHOOD}&address=${ACCOUNT_A}`),
    );
    expect(lookupsOfA).toHaveLength(2);
  });

  it('keeps a confirmed creation through indexer delay, switches and reconnects, then reconciles', async () => {
    lookups[`${ROBINHOOD}:${ACCOUNT_A}`] = [CONTRACT_A];
    lookups[`${GNOSIS}:${ACCOUNT_A}`] = [];
    lookups[`${ROBINHOOD}:${ACCOUNT_B}`] = [];

    const { rerender } = render();
    await waitForShown([CONTRACT_A]);

    // What Create does after the receipt. The indexer has not caught up: it still returns [A].
    act(() => {
      seedStakingContractMetadata(queryClient, HASH_B, {
        name: 'B',
        description: 'b',
      });
      store.dispatch(
        recordCreatedStakingContract({
          chainId: ROBINHOOD,
          account: ACCOUNT_A,
          instance: CONTRACT_B,
          metadataHash: HASH_B,
          name: 'B',
          description: 'b',
        }),
      );
    });
    await waitForShown([CONTRACT_A, CONTRACT_B]);

    // Chain round trip: the fresh lookup still returns [A].
    setNetwork(GNOSIS);
    await waitForShown([]);
    setNetwork(ROBINHOOD);
    await waitForShown([CONTRACT_A, CONTRACT_B]);

    // Another account on the same chain does not see it.
    account = ACCOUNT_B;
    rerender();
    await waitForShown([]);

    // Disconnect and reconnect.
    account = undefined;
    rerender();
    await settle();
    account = ACCOUNT_A;
    rerender();
    await waitForShown([CONTRACT_A, CONTRACT_B]);
    expect(store.getState().launch.createdStakingContracts).toHaveLength(1);

    // The indexer catches up: the local copy is dropped and the list stays the same.
    lookups[`${ROBINHOOD}:${ACCOUNT_A}`] = [CONTRACT_A, CONTRACT_B];
    setNetwork(GNOSIS);
    await waitForShown([]);
    setNetwork(ROBINHOOD);
    await waitForShown([CONTRACT_A, CONTRACT_B]);
    await waitFor(() => expect(store.getState().launch.createdStakingContracts).toEqual([]));
    await settle();
    expect(shownIds()).toEqual([CONTRACT_A, CONTRACT_B]);

    // Create already knew B's metadata.
    expect(ipfsFetches).not.toContain(HASH_B);
    expectEveryCommitOwned({
      [`${ROBINHOOD}:${ACCOUNT_A}`]: [CONTRACT_A, CONTRACT_B],
    });
    // Once listed, no loaded render for its chain and creator dropped it.
    const firstShownAt = commits.findIndex(({ contracts }) =>
      contracts.some(({ id }) => id === CONTRACT_B),
    );
    const dropped = commits
      .slice(firstShownAt)
      .filter(
        (commit) =>
          commit.chainId === ROBINHOOD &&
          commit.account === ACCOUNT_A &&
          !commit.isLoading &&
          !commit.contracts.some(({ id }) => id === CONTRACT_B),
      );
    expect(dropped).toEqual([]);
  });

  it('keeps a confirmed creation listed while its metadata hash read fails, until it resolves', async () => {
    // Discovery already returns B, but B's metadataHash read fails the first time.
    lookups[`${ROBINHOOD}:${ACCOUNT_A}`] = [CONTRACT_B];
    hashFailures[CONTRACT_B] = 1;
    seedStakingContractMetadata(queryClient, HASH_B, {
      name: 'B',
      description: 'b',
    });
    store.dispatch(
      recordCreatedStakingContract({
        chainId: ROBINHOOD,
        account: ACCOUNT_A,
        instance: CONTRACT_B,
        metadataHash: HASH_B,
        name: 'B',
        description: 'b',
      }),
    );

    render();
    await waitForShown([CONTRACT_B]);
    const firstShown = commits.length - 1;
    await settle();
    // Discovery returned B, but its metadata did not resolve from the chain: the local copy stays.
    expect(store.getState().launch.createdStakingContracts).toHaveLength(1);
    expect(shownIds()).toEqual([CONTRACT_B]);

    // The batch is read again while shown; now the local copy can go.
    await waitFor(() => expect(store.getState().launch.createdStakingContracts).toEqual([]), {
      timeout: 8000,
    });
    expect(contractReads.filter((read) => read === `${ROBINHOOD}:${CONTRACT_B}`)).toHaveLength(2);
    await settle();
    expect(shownIds()).toEqual([CONTRACT_B]);
    // B never left the list once shown.
    expect(commits.slice(firstShown).filter(({ contracts }) => contracts.length !== 1)).toEqual([]);
  }, 15000);

  it('reads a failed metadata hash again when the list is next shown', async () => {
    lookups[`${ROBINHOOD}:${ACCOUNT_A}`] = [CONTRACT_A];
    lookups[`${GNOSIS}:${ACCOUNT_A}`] = [];
    hashFailures[CONTRACT_A] = 1;

    render();
    await waitForShown([]);
    setNetwork(GNOSIS);
    await waitForShown([]);
    setNetwork(ROBINHOOD);
    // Well before the in-session retry (5s): the failed batch was marked stale.
    await waitForShown([CONTRACT_A], 2000);
    expect(contractReads.filter((read) => read === `${ROBINHOOD}:${CONTRACT_A}`)).toHaveLength(2);
  });

  it('retries metadata that IPFS failed to serve instead of caching the contract as missing', async () => {
    lookups[`${ROBINHOOD}:${ACCOUNT_A}`] = [CONTRACT_A];
    ipfs[HASH_A] = 'unavailable';

    const { rerender } = render();
    // One retry, then the contract is left out rather than loading forever.
    await waitForShown([], 5000);
    expect(ipfsFetches).toEqual([HASH_A, HASH_A]);

    // The gateway recovers; the user disconnects and reconnects.
    ipfs[HASH_A] = { name: 'A', description: 'a' };
    account = undefined;
    rerender();
    await settle();
    account = ACCOUNT_A;
    rerender();

    await waitForShown([CONTRACT_A]);
  });

  it('stops loading on disconnect while a lookup is unresolved', async () => {
    lookups[`${ROBINHOOD}:${ACCOUNT_A}`] = deferred<string[]>().promise;

    const { rerender } = render();
    await settle();
    expect(shown().isLoading).toBe(true);

    account = undefined;
    rerender();
    await waitForShown([]);
  });

  describe('windowed log fallback', () => {
    const spans = LOGS_MAX_BLOCK_SPAN as Record<number, number>;
    const starts = blockNumbers as unknown as Record<number, number>;
    const window = (fromBlock: number, toBlock: number, sender: string) => [
      BigInt(fromBlock),
      BigInt(toBlock),
      sender,
    ];
    const getLogsCalls = (client: { getLogs: jest.Mock }) =>
      client.getLogs.mock.calls.map(([params]) => [
        params.fromBlock,
        params.toBlock,
        params.args.sender,
      ]);

    beforeEach(() => {
      // No squid: the lookup reads logs from block 1, at most 50 blocks per call.
      (hasSubgraphSupport as unknown as jest.Mock).mockReturnValue(false);
      starts[ROBINHOOD] = 1;
      spans[ROBINHOOD] = 50;
    });

    afterEach(() => {
      (hasSubgraphSupport as unknown as jest.Mock).mockReturnValue(true);
      delete starts[ROBINHOOD];
      delete spans[ROBINHOOD];
    });

    it('reads the logs window by window up to the head and lists every window’s contracts', async () => {
      const client = {
        getBlockNumber: jest.fn().mockResolvedValue(BigInt(100)),
        getLogs: jest
          .fn()
          .mockResolvedValueOnce([{ args: { instance: CONTRACT_A } }])
          .mockResolvedValueOnce([{ args: { instance: CONTRACT_B } }]),
      };
      (usePublicClient as jest.Mock).mockReturnValue(client);

      render();
      await waitForShown([CONTRACT_A, CONTRACT_B]);

      expect(getLogsCalls(client)).toEqual([window(1, 50, ACCOUNT_A), window(51, 100, ACCOUNT_A)]);
      expect(client.getBlockNumber).toHaveBeenCalledTimes(1);
      expect(
        (global.fetch as jest.Mock).mock.calls.filter(([url]) => String(url).startsWith('/api/')),
      ).toEqual([]);
    });

    it('stops reading windows once the account changed', async () => {
      const firstWindow = deferred<{ args: { instance: string } }[]>();
      const client = {
        getBlockNumber: jest.fn().mockResolvedValue(BigInt(100)),
        getLogs: jest.fn().mockReturnValueOnce(firstWindow.promise).mockResolvedValue([]),
      };
      (usePublicClient as jest.Mock).mockReturnValue(client);

      const { rerender } = render();
      await waitFor(() => expect(client.getLogs).toHaveBeenCalledTimes(1));

      account = ACCOUNT_B;
      rerender();
      await act(async () => firstWindow.resolve([{ args: { instance: CONTRACT_A } }]));
      await waitForShown([]);
      await settle();

      // A's second window was never requested; B's lookup read both of its windows.
      expect(getLogsCalls(client)).toEqual([
        window(1, 50, ACCOUNT_A),
        window(1, 50, ACCOUNT_B),
        window(51, 100, ACCOUNT_B),
      ]);
      expectEveryCommitOwned({});
    });
  });

  describe('nomination status', () => {
    it('matches nominees by address and chain', async () => {
      lookups[`${ROBINHOOD}:${ACCOUNT_A}`] = [CONTRACT_A, CONTRACT_B];
      // A is a nominee on Gnosis, not on Robinhood; B is one on Robinhood.
      nomineeSource = [
        { account: bytes32(CONTRACT_A), chainId: BigInt(GNOSIS) },
        { account: bytes32(CONTRACT_B), chainId: BigInt(ROBINHOOD) },
      ];

      render();
      await waitForShown([CONTRACT_A, CONTRACT_B]);
      await waitFor(() => expect(statusOf(CONTRACT_B)).toBe('nominated'));
      expect(statusOf(CONTRACT_A)).toBe('notNominated');
    });

    it('keeps a confirmed nomination through a lagging refresh and a revisit, then reconciles', async () => {
      lookups[`${ROBINHOOD}:${ACCOUNT_A}`] = [CONTRACT_A];
      lookups[`${GNOSIS}:${ACCOUNT_A}`] = [];

      const { result } = render();
      await waitForShown([CONTRACT_A]);
      await waitFor(() => expect(statusOf(CONTRACT_A)).toBe('notNominated'));
      const receiptAt = commits.length;

      // What Nominate does after a successful receipt; the RPC has not caught up yet.
      await act(async () => {
        store.dispatch(
          recordConfirmedNomination({
            chainId: ROBINHOOD,
            address: CONTRACT_A,
          }),
        );
        await result.current.nominees.refetch();
      });
      await waitFor(() => expect(statusOf(CONTRACT_A)).toBe('nominated'));

      setNetwork(GNOSIS);
      await waitForShown([]);
      setNetwork(ROBINHOOD);
      await waitForShown([CONTRACT_A]);
      expect(statusOf(CONTRACT_A)).toBe('nominated');

      // The nominee read includes it now: the local copy is dropped, the status stays.
      nomineeSource = [{ account: bytes32(CONTRACT_A), chainId: BigInt(ROBINHOOD) }];
      await act(async () => {
        await result.current.nominees.refetch();
      });
      await waitFor(() => expect(store.getState().launch.confirmedNominations).toEqual([]));
      expect(statusOf(CONTRACT_A)).toBe('nominated');

      // After the receipt, no committed render showed it as not nominated.
      const staleStatuses = commits
        .slice(receiptAt)
        .flatMap(({ contracts }) => contracts)
        .filter(({ nominationStatus }) => nominationStatus === 'notNominated');
      expect(staleStatuses).toEqual([]);
    });

    it('shows unknown, not a spinner, after the nominee read fails, and recovers on retry', async () => {
      lookups[`${ROBINHOOD}:${ACCOUNT_A}`] = [CONTRACT_A];
      nomineeSource = 'fail';

      const { result } = render();
      await waitForShown([CONTRACT_A]);
      await waitFor(() => expect(statusOf(CONTRACT_A)).toBe('unknown'), {
        timeout: 5000,
      });
      // Initial attempt plus wagmi's 3 retries; nothing is in flight any more.
      expect(nomineeReads).toBe(4);
      expect(result.current.nominees.status).toBe('error');
      expect(result.current.nominees.isFetching).toBe(false);

      nomineeSource = [];
      await act(async () => {
        await result.current.nominees.refetch();
      });
      await waitFor(() => expect(statusOf(CONTRACT_A)).toBe('notNominated'));
    });

    it('shows unknown, not not-nominated, when a refresh fails after a successful read', async () => {
      lookups[`${ROBINHOOD}:${ACCOUNT_A}`] = [CONTRACT_A, CONTRACT_B];
      nomineeSource = [];

      const { result } = render();
      await waitForShown([CONTRACT_A, CONTRACT_B]);
      await waitFor(() => expect(statusOf(CONTRACT_A)).toBe('notNominated'));

      // B is nominated here, and the refresh fails: the read keeps its earlier, empty list.
      nomineeSource = 'fail';
      await act(async () => {
        store.dispatch(
          recordConfirmedNomination({
            chainId: ROBINHOOD,
            address: CONTRACT_B,
          }),
        );
        await result.current.nominees.refetch();
      });
      await waitFor(() => expect(result.current.nominees.status).toBe('error'));
      expect(result.current.nominees.nominees).toEqual([]);

      await waitFor(() => expect(statusOf(CONTRACT_A)).toBe('unknown'));
      expect(statusOf(CONTRACT_B)).toBe('nominated');
      expect(store.getState().launch.confirmedNominations).toEqual([
        `${ROBINHOOD}:${CONTRACT_B.toLowerCase()}`,
      ]);
    });

    it('lists contracts while the nominee read is unresolved', async () => {
      lookups[`${ROBINHOOD}:${ACCOUNT_A}`] = [CONTRACT_A];
      nomineeSource = deferred<NomineeRow[]>().promise;

      render();
      await waitForShown([CONTRACT_A]);
      await settle();
      expect(statusOf(CONTRACT_A)).toBe('loading');
    });
  });
});
