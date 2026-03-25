import { Address, createPublicClient, formatUnits, http } from 'viem';

import { RPC_URLS } from 'libs/util-constants/src';
import { STAKING_TOKEN } from 'libs/util-contracts/src';
import { getAddressFromBytes32 } from 'libs/util-functions/src';
import { fetchNominees, Nominee } from 'libs/common-contract-functions/src';

import {
  fetchStakingDataFromSubgraph,
  hasSubgraphSupport,
  SubgraphStakingRow,
} from 'common-util/graphql';
import { fetchContractCacheDataFromChain } from 'common-util/fetch-contract-cache-data';
import {
  STAKING_CONTRACT_DETAILS,
  getApy,
  getStakeRequired,
  getTimeRemainingFormatted,
} from 'common-util/constants/contracts';
import { ContractCacheData, StakingContract } from 'types';

function getChainClient(chainId: number) {
  const rpc = RPC_URLS[chainId];
  if (!rpc) return null;
  return createPublicClient({
    chain: {
      id: chainId,
      name: '',
      nativeCurrency: { decimals: 18, name: '', symbol: '' },
      rpcUrls: { default: { http: [rpc] } },
    },
    transport: http(rpc),
  });
}

/**
 * Fetches subgraph data for nominees grouped by chain.
 */
async function fetchSubgraphData(nominees: Nominee[]): Promise<Map<string, SubgraphStakingRow>> {
  const byChain = new Map<number, Nominee[]>();
  for (const n of nominees) {
    const c = Number(n.chainId);
    if (!hasSubgraphSupport(c)) continue;
    if (!byChain.has(c)) byChain.set(c, []);
    byChain.get(c)!.push(n);
  }

  const results = await Promise.allSettled(
    [...byChain.entries()].map(([chainId, list]) => {
      const addresses = list.map((n) => getAddressFromBytes32(n.account));
      return fetchStakingDataFromSubgraph(chainId, addresses);
    }),
  );

  const merged = new Map<string, SubgraphStakingRow>();
  let idx = 0;
  for (const [, list] of byChain) {
    const result = results[idx++];
    if (result.status !== 'fulfilled' || !result.value) continue;
    for (const n of list) {
      const addr = getAddressFromBytes32(n.account).toLowerCase();
      const row = result.value.get(addr);
      if (row) merged.set(n.account, row);
    }
  }

  return merged;
}

/**
 * Fetches cache data for nominees from RPC + IPFS.
 */
async function fetchCacheData(nominees: Nominee[]): Promise<Map<string, ContractCacheData>> {
  const results = await Promise.allSettled(
    nominees.map(async (n) => {
      const address = getAddressFromBytes32(n.account);
      const chainId = Number(n.chainId);
      const data = await fetchContractCacheDataFromChain(chainId, address);
      return { account: n.account, data };
    }),
  );

  const cacheMap = new Map<string, ContractCacheData>();
  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value.data) {
      cacheMap.set(result.value.account, result.value.data);
    }
  });

  return cacheMap;
}

/**
 * Fetches RPC data for a list of nominees that don't have subgraph or cache data.
 */
async function fetchRpcData(
  nominees: Nominee[],
  functionNames: string[],
): Promise<Map<string, Record<string, unknown>>> {
  const results = new Map<string, Record<string, unknown>>();
  if (nominees.length === 0) return results;

  const allResults = await Promise.allSettled(
    nominees.map(async (n) => {
      const address = getAddressFromBytes32(n.account);
      const chainId = Number(n.chainId);
      const client = getChainClient(chainId);
      if (!client) return { account: n.account, data: {} };

      const contractArgs = { address: address as Address, abi: STAKING_TOKEN.abi };
      const callResults = await Promise.allSettled(
        functionNames.map((fn) => client.readContract({ ...contractArgs, functionName: fn })),
      );

      const data: Record<string, unknown> = {};
      functionNames.forEach((fn, i) => {
        const result = callResults[i];
        if (result.status === 'fulfilled') {
          data[fn] = result.value;
        }
      });

      return { account: n.account, data };
    }),
  );

  allResults.forEach((result) => {
    if (result.status === 'fulfilled') {
      results.set(result.value.account, result.value.data);
    }
  });

  return results;
}

/**
 * Fetches latest block timestamps per chain.
 */
async function fetchBlockTimestamps(chainIds: number[]): Promise<Map<number, bigint>> {
  const timestamps = new Map<number, bigint>();

  const results = await Promise.allSettled(
    chainIds.map(async (chainId) => {
      const client = getChainClient(chainId);
      if (!client) return { chainId, timestamp: null };
      const block = await client.getBlock({ blockTag: 'latest' });
      return { chainId, timestamp: block.timestamp };
    }),
  );

  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value.timestamp != null) {
      timestamps.set(result.value.chainId, result.value.timestamp);
    }
  });

  return timestamps;
}

/**
 * Fetches all operate staking contracts with their constants.
 * Can be used in getServerSideProps.
 */
export async function fetchOperateContracts(): Promise<StakingContract[]> {
  const nominees = await fetchNominees();
  if (nominees.length === 0) return [];

  // Fetch subgraph data and cache data in parallel
  const [subgraphMap, cacheMap] = await Promise.all([
    fetchSubgraphData(nominees),
    fetchCacheData(nominees),
  ]);

  // Determine nominees that need RPC fallback
  const uncachedNominees = nominees.filter(
    (n) => !subgraphMap.has(n.account) && !cacheMap.has(n.account),
  );

  // Fetch RPC data and block timestamps in parallel
  // getServiceIds and availableRewards are fetched for ALL nominees because
  // subgraph agentIds is config (whitelisted agent types), not staked service count,
  // and subgraph checkpoint availableRewards can be stale or '0'.
  const uniqueChainIds = [...new Set(nominees.map((n) => Number(n.chainId)))];
  const [uncachedRpc, allNomineesRpc, blockTimestamps] = await Promise.all([
    fetchRpcData(uncachedNominees, [
      'maxNumServices',
      'rewardsPerSecond',
      'minStakingDeposit',
      'numAgentInstances',
      'livenessPeriod',
      'metadataHash',
    ]),
    fetchRpcData(nominees, ['getServiceIds', 'availableRewards']),
    fetchBlockTimestamps(uniqueChainIds),
  ]);

  // Also fetch epochCounter and tsCheckpoint for ALL nominees
  const allRpc = await fetchRpcData(nominees, ['epochCounter', 'tsCheckpoint']);

  return nominees.map((item) => {
    const subgraphRow = subgraphMap.get(item.account);
    const cached = cacheMap.get(item.account);
    const uncachedData = uncachedRpc.get(item.account) ?? {};
    const allNomineesData = allNomineesRpc.get(item.account) ?? {};
    const allData = allRpc.get(item.account) ?? {};

    // Max slots
    const maxSlots = subgraphRow
      ? subgraphRow.maxNumServices
      : cached
        ? cached.config.maxNumServices
        : Number(uncachedData.maxNumServices ?? 0);

    // Filled slots — always from RPC (subgraph agentIds is config, not staked count)
    const servicesLength = ((allNomineesData.getServiceIds as readonly bigint[] | undefined) ?? [])
      .length;

    // Available rewards — prefer RPC, fallback to subgraph
    const rpcAvailableRewards = allNomineesData.availableRewards as bigint | undefined;
    const availableRewardsInWei =
      rpcAvailableRewards ?? (subgraphRow ? BigInt(subgraphRow.availableRewards) : 0n);

    const availableSlots =
      availableRewardsInWei > 0n && maxSlots > 0 ? maxSlots - servicesLength : 0;

    // Rewards/deposit/instances
    const rewardsPerSecond = subgraphRow
      ? BigInt(subgraphRow.rewardsPerSecond)
      : cached
        ? BigInt(cached.config.rewardsPerSecond)
        : ((uncachedData.rewardsPerSecond as bigint) ?? 0n);

    const minStakingDeposit = subgraphRow
      ? BigInt(subgraphRow.minStakingDeposit)
      : cached
        ? BigInt(cached.config.minStakingDeposit)
        : ((uncachedData.minStakingDeposit as bigint) ?? 0n);

    const numAgentInstances = subgraphRow
      ? BigInt(subgraphRow.numAgentInstances)
      : cached
        ? BigInt(cached.config.numAgentInstances)
        : ((uncachedData.numAgentInstances as bigint) ?? 1n);

    const availableRewards = formatUnits(availableRewardsInWei, 18);
    const apy = getApy(rewardsPerSecond, minStakingDeposit, numAgentInstances);
    const stakeRequired = getStakeRequired(minStakingDeposit, numAgentInstances);

    // Contract details
    const contractAddress = getAddressFromBytes32(item.account);
    const cachedDetails = cached?.operateDetails;
    const hardcodedDetails = STAKING_CONTRACT_DETAILS[item.account];
    const details = { ...(cachedDetails ?? {}), ...(hardcodedDetails ?? {}) };

    // Epoch and time remaining
    const epoch = Number(allData.epochCounter ?? 0);
    const livenessPeriodSeconds = cached
      ? Number(cached.config.livenessPeriod)
      : Number(uncachedData.livenessPeriod ?? 0);
    const tsCheckpointSeconds = Number(allData.tsCheckpoint ?? 0);

    const blockTimestamp = blockTimestamps.get(Number(item.chainId));
    const timeRemainingSeconds = blockTimestamp
      ? livenessPeriodSeconds - (Number(blockTimestamp) - tsCheckpointSeconds)
      : 0;
    const timeRemaining = getTimeRemainingFormatted(timeRemainingSeconds);

    const meta = cached?.metadata ?? { name: '', description: '' };

    return {
      key: item.account as Address,
      address: contractAddress,
      chainId: Number(item.chainId),
      metadata: meta,
      availableSlots,
      maxSlots,
      apy: apy ?? 0,
      stakeRequired: stakeRequired ?? '0',
      availableOn: details?.availableOn ?? null,
      availableRewards,
      epoch,
      timeRemaining,
    };
  });
}
