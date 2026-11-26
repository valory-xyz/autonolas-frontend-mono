import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Abi, Address, PublicClient } from 'viem';
import { useAccount, usePublicClient, useReadContracts } from 'wagmi';

import { GATEWAY_URL, HASH_PREFIX } from 'libs/util-constants/src';
import { STAKING_FACTORY, STAKING_TOKEN } from 'libs/util-contracts/src/lib/abiAndAddresses';
import { getBytes32FromAddress } from 'libs/util-functions/src';

import { ChainId, LOGS_MAX_BLOCK_SPAN, blockNumbers } from 'common-util/constants/stakingContract';
import { CONTRACT_TEMPLATES } from 'common-util/constants/stakingContract';
import { getBlockRanges } from 'common-util/functions/blockRanges';
import { hasSubgraphSupport, StakingContractsResponse } from 'common-util/graphql/my-contracts';
import {
  StakingContractMetadata,
  myStakingContractAddressesKey,
  stakingContractMetadataKey,
} from 'common-util/queries/myStakingContracts';
import { useAppDispatch, useAppSelector } from 'store/index';
import {
  CreatedStakingContract,
  nominationKey,
  reconcileConfirmedNominations,
  reconcileCreatedStakingContracts,
  setContractsLoading,
  setMyStakingContracts,
} from 'store/launch';
import { MyStakingContract, NominationStatus } from 'types/index';

import { getMyStakingContractsOwner } from './useMyStakingContracts';
import { Nominee, useNominees } from './useNominees';

// Timeout for IPFS metadata fetches in ms
// This prevents the UI from hanging indefinitely when IPFS content doesn't exist
const IPFS_FETCH_TIMEOUT_MS = 5000;

/**
 * Fetches the metadata behind one `metadataHash`. Every failure (HTTP error, timeout, bad JSON)
 * throws, so the query records an error and tries again later instead of caching a missing
 * contract as if IPFS had answered.
 */
const fetchMetadata = async (
  metadataHash: string,
  signal: AbortSignal,
): Promise<StakingContractMetadata> => {
  const uri = `${HASH_PREFIX}${metadataHash.substring(2)}`;
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timeoutId = setTimeout(abort, IPFS_FETCH_TIMEOUT_MS);
  signal.addEventListener('abort', abort);

  try {
    const response = await fetch(`${GATEWAY_URL}${uri}`, {
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch IPFS metadata for ${uri}: ${response.status}`);
    }
    return (await response.json()) as StakingContractMetadata;
  } catch (error) {
    if (!signal.aborted) window.console.warn(error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
    signal.removeEventListener('abort', abort);
  }
};

const EMPTY_ADDRESSES: Address[] = [];

// Reads of a batch in which some metadataHash read failed, while the list is shown.
const METADATA_HASH_READ_ATTEMPTS = 3;
const METADATA_HASH_RETRY_MS = 5000;

const hasFailedRead = (results: { status: string }[] | undefined) =>
  !!results?.some(({ status }) => status === 'failure');

/**
 * Name and description of each staking contract, in address order (null where unavailable).
 *
 * One query per metadata hash: IPFS content behind a hash never changes, so a success is kept
 * for good (and a contract created in this session is seeded by Create), while a failure stays
 * an error that is retried once and again whenever the list is next shown. The fetches used to
 * run in an async `select`, which is a new function on every render, so TanStack re-ran it —
 * and refetched IPFS — on every render that storing its result caused.
 */
const useGetMyStakingContractsMetadata = (chainId: ChainId | undefined, addresses: Address[]) => {
  const hasAddresses = !!chainId && addresses.length > 0;

  const queryClient = useQueryClient();
  const {
    data: hashResults,
    status: hashStatus,
    queryKey: hashQueryKey,
  } = useReadContracts({
    contracts: addresses.map((address) => ({
      address,
      abi: STAKING_TOKEN.abi as Abi,
      chainId,
      functionName: 'metadataHash',
    })),
    query: {
      enabled: hasAddresses,
      // A failed read comes back as one entry of a successful batch, so it is not retried like
      // an error: read the batch again a few times while it is shown.
      refetchInterval: (query) =>
        hasFailedRead(query.state.data) && query.state.dataUpdateCount < METADATA_HASH_READ_ATTEMPTS
          ? METADATA_HASH_RETRY_MS
          : false,
    },
  });

  // ...and mark such a batch stale, which the app's staleTime: Infinity never does, so it is
  // read again whenever the list is next shown (switching back to this chain or account) or the
  // window regains focus, instead of hiding those contracts until a reload.
  const hasFailedHashRead = hasFailedRead(hashResults);
  useEffect(() => {
    if (!hasFailedHashRead) return;
    queryClient.getQueryCache().find({ queryKey: hashQueryKey, exact: true })?.invalidate();
  }, [queryClient, hasFailedHashRead, hashQueryKey]);

  const metadataHashes = hasAddresses
    ? (hashResults?.map(({ result }) => (result as string | undefined) ?? null) ?? [])
    : [];

  const metadataResults = useQueries({
    queries: metadataHashes.map((metadataHash) => ({
      queryKey: stakingContractMetadataKey(metadataHash ?? ''),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        fetchMetadata(metadataHash as string, signal),
      enabled: !!metadataHash,
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      retry: 1,
    })),
  });

  const isLoading =
    hasAddresses &&
    (hashStatus === 'pending' ||
      metadataResults.some(({ status }, index) => !!metadataHashes[index] && status === 'pending'));

  return {
    metadata: metadataResults.map(({ data }) => data ?? null),
    isLoading,
  };
};

const INSTANCE_CREATED_EVENT = {
  type: 'event',
  name: 'InstanceCreated',
  inputs: [
    { type: 'address', indexed: true, name: 'sender' },
    { type: 'address', indexed: true, name: 'instance' },
    { type: 'address', indexed: true, name: 'implementation' },
  ],
} as const;

const fetchInstanceAddresses = async (
  chainId: ChainId,
  account: Address,
  client: PublicClient,
  signal: AbortSignal,
): Promise<Address[]> => {
  // Try fetching from subgraph first if available
  if (hasSubgraphSupport(chainId)) {
    try {
      const response = await fetch(`/api/my-contracts?chainId=${chainId}&address=${account}`, {
        signal,
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data: StakingContractsResponse = await response.json();
      return data.stakingContracts.map((contract) => contract.instance as Address);
    } catch (subgraphError) {
      if (signal.aborted) throw subgraphError;
      window.console.warn('Subgraph fetch failed, falling back to event logs:', subgraphError);
    }
  }

  // Fallback to fetching from logs
  const fromBlock = blockNumbers[chainId] ? BigInt(blockNumbers[chainId]) : undefined;
  const maxSpan = LOGS_MAX_BLOCK_SPAN[chainId];

  // RPCs that cap the block span of one call (see LOGS_MAX_BLOCK_SPAN) get windows up to the
  // current head; other chains keep a single call to 'latest'.
  const ranges: { fromBlock?: bigint; toBlock: bigint | 'latest' }[] =
    fromBlock !== undefined && maxSpan
      ? getBlockRanges(fromBlock, await client.getBlockNumber(), BigInt(maxSpan))
      : [{ fromBlock, toBlock: 'latest' }];

  const addresses: Address[] = [];
  // One window at a time: public RPCs rate-limit bursts of getLogs calls. Stop early once the
  // chain or account changed and nothing reads this result any more.
  for (const range of ranges) {
    signal.throwIfAborted();
    const eventLogs = await client.getLogs({
      address: STAKING_FACTORY.addresses[`${chainId}`] as Address,
      event: INSTANCE_CREATED_EVENT,
      args: { sender: account },
      fromBlock: range.fromBlock,
      toBlock: range.toBlock,
    });
    addresses.push(...eventLogs.map((log) => log.args?.instance as Address));
  }

  return addresses;
};

/**
 * Staking contracts the connected account created on the selected chain.
 *
 * Keyed by chain and account, so a result is only ever read under the chain and account that
 * produced it: after a switch the addresses are empty in the same render (or the cached list
 * for that pair), never the previous pair's, and no read is built from them on the new chain.
 */
const useGetInstanceAddresses = (chainId: ChainId | undefined) => {
  const client = usePublicClient({ chainId });
  const { address: account } = useAccount();
  const isEnabled = !!chainId && !!account && !!client;

  const { data, status } = useQuery({
    queryKey: myStakingContractAddressesKey(chainId, account),
    queryFn: async ({ signal }) => {
      try {
        return await fetchInstanceAddresses(
          chainId as ChainId,
          account as Address,
          client as PublicClient,
          signal,
        );
      } catch (error) {
        if (!signal.aborted) window.console.error(error);
        throw error;
      }
    },
    enabled: isEnabled,
    // The app defaults to staleTime: Infinity. Contracts get created, so switching back to a
    // chain and account shows its cached list and looks it up again; Create also adds its new
    // contract to this cache. Not on window focus: the log fallback can be several RPC calls.
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: false,
  });

  return {
    // A failed lookup shows no contracts rather than leaving the list loading.
    instanceAddresses: data ?? EMPTY_ADDRESSES,
    // What discovery returned for this chain and account, once it has answered.
    discoveredAddresses: isEnabled ? data : undefined,
    isLoading: isEnabled && status === 'pending',
  };
};

/** Discovered addresses first, then this session's creations discovery does not return yet. */
const mergeAddresses = (discovered: Address[], created: CreatedStakingContract[]) => {
  const seen = new Set(discovered.map((address) => address.toLowerCase()));
  const pending = created
    .map(({ instance }) => instance)
    .filter((instance) => !seen.has(instance.toLowerCase()));
  return pending.length ? [...discovered, ...pending] : discovered;
};

/** Nominees as `${chainId}:${bytes32 account}`, so a match needs both the address and the chain. */
const toNomineeKeys = (nominees: Nominee[]) =>
  new Set(nominees.map(({ account, chainId }) => `${chainId.toString()}:${account.toLowerCase()}`));

const nomineeKeyOf = (chainId: number, address: string) =>
  `${chainId}:${getBytes32FromAddress(address).toLowerCase()}`;

export const useGetMyStakingContracts = () => {
  const dispatch = useAppDispatch();
  const { networkId } = useAppSelector((state) => state.network);
  const { address: account } = useAccount();
  const chainId = (networkId ?? undefined) as ChainId | undefined;
  const owner = getMyStakingContractsOwner(networkId, account);

  const {
    instanceAddresses: discoveredAddresses,
    discoveredAddresses: discoveryResult,
    isLoading: isInstancesLoading,
  } = useGetInstanceAddresses(chainId);

  // Contracts this account created on this chain in this session. Discovery can lag a fresh
  // deployment (indexer delay), so they are listed until discovery returns them too.
  const createdStakingContracts = useAppSelector((state) => state.launch.createdStakingContracts);
  const created = createdStakingContracts.filter(
    (item) => item.chainId === owner.chainId && item.account === owner.account,
  );
  const instanceAddresses = mergeAddresses(discoveredAddresses, created);

  const { metadata: myStakingContractsMetadata, isLoading: isMetadataLoading } =
    useGetMyStakingContractsMetadata(chainId, instanceAddresses);

  const { nominees, status: nomineesStatus } = useNominees();
  const confirmedNominations = useAppSelector((state) => state.launch.confirmedNominations);
  const nomineeKeys = nominees ? toNomineeKeys(nominees) : null;

  // Discovery caught up with a creation and its metadata resolved from the chain: drop the local
  // copy. Until both hold (a failed metadataHash read, say), the copy keeps the contract listed.
  const caughtUp =
    owner.chainId !== null && discoveryResult
      ? created
          .filter(({ instance }) => {
            const address = instance.toLowerCase();
            const index = instanceAddresses.findIndex((item) => item.toLowerCase() === address);
            return (
              discoveryResult.some((item) => item.toLowerCase() === address) &&
              !!myStakingContractsMetadata[index]
            );
          })
          .map(({ instance }) => instance.toLowerCase())
      : [];
  const caughtUpKey = caughtUp.join(',');
  useEffect(() => {
    if (!caughtUpKey || owner.chainId === null) return;
    dispatch(
      reconcileCreatedStakingContracts({
        chainId: owner.chainId,
        instances: caughtUpKey.split(','),
      }),
    );
  }, [dispatch, caughtUpKey, owner.chainId]);

  // The nominee read caught up with a nomination confirmed here: drop the local copy. Only from
  // a current read: after a failed refresh the copy keeps the contract nominated.
  const nominatedKey =
    nomineeKeys && nomineesStatus === 'success'
      ? confirmedNominations
          .filter((key) => {
            const [nomineeChainId, address] = key.split(':');
            return nomineeKeys.has(nomineeKeyOf(Number(nomineeChainId), address));
          })
          .join('|')
      : '';
  useEffect(() => {
    if (nominatedKey) dispatch(reconcileConfirmedNominations(nominatedKey.split('|')));
  }, [dispatch, nominatedKey]);

  const getNominationStatus = (address: Address): NominationStatus => {
    if (owner.chainId === null) return 'unknown';
    if (confirmedNominations.includes(nominationKey(owner.chainId, address))) return 'nominated';
    // Checked before the data: a failed refresh keeps the previous nominee list alongside the
    // error, and that list can predate a nomination.
    if (nomineesStatus === 'error') return 'unknown';
    if (nomineeKeys) {
      return nomineeKeys.has(nomineeKeyOf(owner.chainId, address)) ? 'nominated' : 'notNominated';
    }
    return 'loading';
  };

  // The list is ready once addresses and metadata are; nomination status is per contract and
  // never holds the list back (a failed nominee read shows `unknown`, not a spinner).
  const isLoading = isInstancesLoading || isMetadataLoading;

  // The list to publish with its owner, or null while loading. Serialized so the store only hears
  // about real changes: re-renders, refetches returning the same data, or new array identities
  // from the queries never re-dispatch.
  let published: string | null = null;
  if (!isLoading) {
    const myStakingContractsList: MyStakingContract[] = instanceAddresses
      .map((address, index) => {
        const metadata =
          myStakingContractsMetadata[index] ??
          created.find((item) => item.instance.toLowerCase() === address.toLowerCase()) ??
          null;

        if (!metadata) return null;

        return {
          id: address,
          chainId: owner.chainId as number,
          name: metadata.name,
          description: metadata.description,
          template: CONTRACT_TEMPLATES[0].title,
          nominationStatus: getNominationStatus(address),
        };
      })
      // filter out null values (ie. contracts without metadata - failed to fetch or not available)
      .filter((contract): contract is MyStakingContract => contract !== null);

    published = JSON.stringify({ owner, contracts: myStakingContractsList });
  }

  useEffect(() => {
    // Publish loading too: otherwise the store keeps the previous account's contracts, or
    // reports an empty list as loaded, until this account's lookup finishes. Consumers also
    // compare the published owner with the current chain and account (useMyStakingContracts),
    // which covers the render before this effect runs.
    if (published === null) {
      dispatch(setContractsLoading());
      return;
    }

    dispatch(setMyStakingContracts(JSON.parse(published)));
  }, [dispatch, published]);
};
