import { getPublicClient } from '@wagmi/core';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ContractCacheSnapshot, Nominee, StakingContract } from 'types';
import { Abi, Address, Block, formatUnits } from 'viem';
import { getBlock } from 'viem/actions';
import { useReadContracts } from 'wagmi';

import { useNominees, useNomineesMetadata } from 'libs/common-contract-functions/src';
import { BLACKLISTED_STAKING_ADDRESSES } from 'libs/util-constants/src';
import { STAKING_TOKEN } from 'libs/util-contracts/src';
import { areAddressesEqual, getAddressFromBytes32 } from 'libs/util-functions/src';

import { wagmiConfig } from 'common-util/config/wagmi';
import {
  fetchStakingDataFromSubgraph,
  hasSubgraphSupport,
  SubgraphStakingRow,
} from 'common-util/graphql';
import {
  STAKING_CONTRACT_DETAILS,
  getApy,
  getStakeRequired,
  getTimeRemainingFormatted,
} from 'common-util/constants/contracts';

const useContractDetails = (nominees: Nominee[], functionName: string) => {
  const contracts = nominees.map((nominee) => ({
    address: getAddressFromBytes32(nominee.account),
    abi: STAKING_TOKEN.abi as Abi,
    chainId: Number(nominee.chainId),
    functionName: functionName,
  }));

  const { data, isFetching } = useReadContracts({
    contracts,
    query: {
      enabled: nominees.length > 0,
      select: (data) => {
        return data.map((item) => (item.status === 'success' ? item.result : null));
      },
    },
  });

  return { data, isFetching };
};

// Custom hook to fetch blocks for each nominee's chain ID
const useBlocksForNominees = (nominees: Nominee[]) => {
  const [blocks, setBlocks] = useState<Map<string, Block>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  const fetchBlocks = useCallback(async () => {
    if (nominees.length === 0) return;

    setIsLoading(true);
    const blockMap = new Map<string, Block>();

    try {
      // Fetch blocks for each nominee's chain ID in parallel
      const blockPromises = [...new Set(nominees.map((item) => item.chainId))].map(
        async (chainId) => {
          try {
            const publicClient = getPublicClient(wagmiConfig, { chainId: Number(chainId) });
            if (!publicClient) {
              throw new Error(`No public client found for chainId ${chainId}`);
            }
            const block = await getBlock(publicClient, { blockTag: 'latest' });
            return { chainId, block };
          } catch (error) {
            console.warn(`Failed to fetch block for chain ${chainId}:`, error);
            return { chainId, block: null };
          }
        },
      );

      const results = await Promise.all(blockPromises);

      results.forEach(({ chainId, block }) => {
        if (block) {
          blockMap.set(chainId.toString(), block);
        }
      });

      setBlocks(blockMap);
    } catch (error) {
      console.error('Error fetching blocks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [nominees]);

  useEffect(() => {
    fetchBlocks();
  }, [nominees, fetchBlocks]);

  return { blocks, isLoading };
};

/**
 * Fetches blob cache for each nominee; returns map of account (bytes32) -> cached payload.
 */
function useContractCacheMap(nominees: Nominee[]) {
  const [cacheMap, setCacheMap] = useState<Map<string, ContractCacheSnapshot>>(new Map());
  const nomineeCacheKey = useMemo(
    () => nominees.map((n) => `${n.chainId}:${n.account}`).join(','),
    [nominees],
  );

  useEffect(() => {
    if (nominees.length === 0) {
      setCacheMap(new Map());
      return;
    }

    let cancelled = false;

    const load = async () => {
      const results = await Promise.all(
        nominees.map(async (n) => {
          const address = getAddressFromBytes32(n.account);
          const chainId = Number(n.chainId);
          if (
            !address ||
            typeof address !== 'string' ||
            address.length < 42 ||
            chainId == null ||
            Number.isNaN(chainId) ||
            chainId <= 0
          ) {
            return { account: n.account, payload: null };
          }
          try {
            const res = await fetch(`/api/contracts/${chainId}/${address}`);
            if (!res.ok) return { account: n.account, payload: null };
            const payload = (await res.json()) as ContractCacheSnapshot;
            return { account: n.account, payload };
          } catch {
            return { account: n.account, payload: null };
          }
        }),
      );

      if (cancelled) return;
      const next = new Map<string, ContractCacheSnapshot>();
      results.forEach(({ account, payload }) => {
        if (payload) next.set(account, payload);
      });
      setCacheMap(next);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [nomineeCacheKey, nominees]);

  return cacheMap;
}

/** Normalize address for subgraph lookup (id is lowercase in subgraph). */
function normalizeAddress(addr: string): string {
  return addr.toLowerCase().startsWith('0x') ? addr.toLowerCase() : addr;
}

/**
 * Fetches APY, max/available slots, and rewards pool from staking subgraph for supported chains.
 * Returns map of nominee.account (bytes32) -> SubgraphStakingRow; empty for unsupported chains.
 */
function useSubgraphStakingData(nominees: Nominee[]) {
  const [subgraphMap, setSubgraphMap] = useState<Map<string, SubgraphStakingRow>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const nomineeKey = useMemo(
    () => nominees.map((n) => `${n.chainId}:${n.account}`).join(','),
    [nominees],
  );

  useEffect(() => {
    if (nominees.length === 0) {
      setSubgraphMap(new Map());
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const load = async () => {
      const byChain = new Map<number, Nominee[]>();
      for (const n of nominees) {
        const c = Number(n.chainId);
        if (!hasSubgraphSupport(c)) continue;
        if (!byChain.has(c)) byChain.set(c, []);
        byChain.get(c)!.push(n);
      }

      const results = await Promise.all(
        [...byChain.entries()].map(([chainId, list]) => {
          const addresses = list.map((n) => getAddressFromBytes32(n.account));
          return fetchStakingDataFromSubgraph(chainId, addresses);
        }),
      );

      if (cancelled) return;

      const merged = new Map<string, SubgraphStakingRow>();
      let idx = 0;
      for (const [, list] of byChain) {
        const data = results[idx++];
        if (!data) continue;
        for (const n of list) {
          const addr = normalizeAddress(getAddressFromBytes32(n.account));
          const row = data.get(addr);
          if (row) merged.set(n.account, row);
        }
      }
      setSubgraphMap(merged);
      setIsLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [nomineeKey, nominees]);

  return { subgraphMap, isSubgraphLoading: isLoading };
}

export const useStakingContractsList = () => {
  // Get nominees list
  const { data: nomineesData, isFetching: isNomineesLoading } = useNominees();
  const nominees = useMemo(() => {
    return (nomineesData || []).filter(
      (nominee) =>
        !BLACKLISTED_STAKING_ADDRESSES.some((blackListedNominee) =>
          areAddressesEqual(blackListedNominee, getAddressFromBytes32(nominee.account)),
        ),
    );
  }, [nomineesData]);

  const cacheMap = useContractCacheMap(nominees);
  const { subgraphMap, isSubgraphLoading } = useSubgraphStakingData(nominees);

  const uncachedNominees = useMemo(
    () => nominees.filter((n) => !cacheMap.get(n.account) && !subgraphMap.get(n.account)),
    [nominees, cacheMap, subgraphMap],
  );

  // Fetch blocks for each nominee's chain ID
  const { blocks, isLoading: areBlocksLoading } = useBlocksForNominees(nominees);

  // Get contracts metadata (only for nominees not in blob cache)
  const { data: metadata, isLoading: isMetadataLoading } = useNomineesMetadata(uncachedNominees);
  // Get maxNumServices (only for uncached, i.e. no cache and no subgraph)
  const { data: maxNumServicesList, isFetching: isMaxNumServicesLoading } = useContractDetails(
    uncachedNominees,
    'maxNumServices',
  );
  // Get serviceIds via RPC for all nominees — the subgraph agentIds field is config
  // (whitelisted agent types), not the count of currently staked services.
  const { data: serviceIdsList, isFetching: isServiceIdsLoading } = useContractDetails(
    nominees,
    'getServiceIds',
  );
  // Get rewardsPerSecond (only for uncached)
  const { data: rewardsPerSecondList, isFetching: isRewardsPerSecondLoading } = useContractDetails(
    uncachedNominees,
    'rewardsPerSecond',
  );
  // Get available rewards via RPC for all nominees — subgraph checkpoint data is stale and
  // returns '0' for contracts that have never had a checkpoint called.
  const { data: availableRewardsList, isFetching: isAvailableRewardsLoading } = useContractDetails(
    nominees,
    'availableRewards',
  );
  // Get minStakingDeposit (only for uncached)
  const { data: minStakingDepositList, isFetching: isMinStakingDepositLoading } =
    useContractDetails(uncachedNominees, 'minStakingDeposit');
  // Get numAgentInstances (only for uncached)
  const { data: numAgentInstancesList, isFetching: isNumAgentInstancesLoading } =
    useContractDetails(uncachedNominees, 'numAgentInstances');

  // Get epochCounter (live data, all nominees)
  const { data: epochCounter, isFetching: isEpochCounterLoading } = useContractDetails(
    nominees,
    'epochCounter',
  );
  // Get livenessPeriod (only for uncached)
  const { data: livenessPeriod, isFetching: isLivenessPeriodLoading } = useContractDetails(
    uncachedNominees,
    'livenessPeriod',
  );
  // Get tsCheckpoint (live data, all nominees)
  const { data: tsCheckpoint, isFetching: isTsCheckpointLoading } = useContractDetails(
    nominees,
    'tsCheckpoint',
  );

  /** Map account -> config for uncached nominees (used when merging with blob cache). */
  const uncachedConfigByAccount = useMemo(() => {
    const maxNumServices = new Map<string, number>();
    const rewardsPerSecond = new Map<string, bigint>();
    const minStakingDeposit = new Map<string, bigint>();
    const numAgentInstances = new Map<string, bigint>();
    const livenessPeriodMap = new Map<string, number>();
    uncachedNominees.forEach((n, i) => {
      const maxNum = maxNumServicesList?.[i];
      if (maxNum != null) maxNumServices.set(n.account, Number(maxNum));
      const rewards = rewardsPerSecondList?.[i];
      if (rewards != null) rewardsPerSecond.set(n.account, rewards as bigint);
      const minDep = minStakingDepositList?.[i];
      if (minDep != null) minStakingDeposit.set(n.account, minDep as bigint);
      const numAg = numAgentInstancesList?.[i];
      if (numAg != null) numAgentInstances.set(n.account, (numAg as bigint) || 1n);
      const liveness = livenessPeriod?.[i];
      if (liveness != null) livenessPeriodMap.set(n.account, Number(liveness));
    });
    return {
      maxNumServices,
      rewardsPerSecond,
      minStakingDeposit,
      numAgentInstances,
      livenessPeriod: livenessPeriodMap,
    };
  }, [
    uncachedNominees,
    maxNumServicesList,
    rewardsPerSecondList,
    minStakingDepositList,
    numAgentInstancesList,
    livenessPeriod,
  ]);

  /**
   * Build staking contracts list: config/metadata from blob cache when present, else RPC;
   * live data (slots, rewards pool, epoch, time remaining) always from RPC.
   */
  const contracts = useMemo(() => {
    const nonSubgraphRpcReady =
      serviceIdsList != null &&
      serviceIdsList.length === nominees.length &&
      availableRewardsList != null &&
      availableRewardsList.length === nominees.length;

    if (
      !nominees.length ||
      !nonSubgraphRpcReady ||
      !epochCounter ||
      epochCounter.length !== nominees.length ||
      !tsCheckpoint ||
      tsCheckpoint.length !== nominees.length ||
      !blocks
    ) {
      return [];
    }

    const metadataReady = uncachedNominees.length === 0 || metadata != null;
    if (!metadataReady) return [];

    return nominees.map((item, index) => {
      const subgraphRow = subgraphMap.get(item.account);
      const cached = cacheMap.get(item.account);

      const maxSlots = subgraphRow
        ? subgraphRow.maxNumServices
        : cached
          ? cached.data.config.maxNumServices
          : (uncachedConfigByAccount.maxNumServices.get(item.account) ?? 0);
      const servicesLength = ((serviceIdsList?.[index] as readonly bigint[] | undefined) ?? [])
        .length;
      const rpcAvailableRewards = availableRewardsList?.[index] as bigint | null;
      const availableRewardsInWei =
        rpcAvailableRewards ?? (subgraphRow ? BigInt(subgraphRow.availableRewards) : 0n);
      const availableSlots =
        availableRewardsInWei > 0n && maxSlots > 0 ? maxSlots - servicesLength : 0;

      const rewardsPerSecond = subgraphRow
        ? BigInt(subgraphRow.rewardsPerSecond)
        : cached
          ? BigInt(cached.data.config.rewardsPerSecond)
          : (uncachedConfigByAccount.rewardsPerSecond.get(item.account) ?? 0n);
      const minStakingDeposit = subgraphRow
        ? BigInt(subgraphRow.minStakingDeposit)
        : cached
          ? BigInt(cached.data.config.minStakingDeposit)
          : (uncachedConfigByAccount.minStakingDeposit.get(item.account) ?? 0n);
      const numAgentInstances = subgraphRow
        ? BigInt(subgraphRow.numAgentInstances)
        : cached
          ? BigInt(cached.data.config.numAgentInstances)
          : (uncachedConfigByAccount.numAgentInstances.get(item.account) ?? 1n);

      const availableRewards =
        availableRewardsInWei != null ? formatUnits(availableRewardsInWei as bigint, 18) : '0';

      const apy = getApy(rewardsPerSecond, minStakingDeposit, numAgentInstances);
      const stakeRequired = getStakeRequired(minStakingDeposit, numAgentInstances);

      const contractAddress = getAddressFromBytes32(item.account);
      const cachedDetails = cached?.data.operateDetails;
      const hardcodedDetails = STAKING_CONTRACT_DETAILS[item.account];
      const details = { ...(cachedDetails ?? {}), ...(hardcodedDetails ?? {}) };
      const epoch = Number(epochCounter[index]);
      const livenessPeriodSeconds = cached
        ? Number(cached.data.config.livenessPeriod)
        : (uncachedConfigByAccount.livenessPeriod.get(item.account) ?? 0);
      const tsCheckpointSeconds = Number(tsCheckpoint[index]);

      const contractBlock = blocks.get(item.chainId.toString());
      const timeRemainingSeconds = contractBlock
        ? livenessPeriodSeconds - (Number(contractBlock.timestamp) - tsCheckpointSeconds)
        : 0;
      const timeRemaining = getTimeRemainingFormatted(timeRemainingSeconds);

      const meta = cached?.data.metadata ?? metadata?.[item.account];

      return {
        key: item.account as Address,
        address: contractAddress,
        chainId: Number(item.chainId),
        metadata: meta ?? { name: '', description: '' },
        availableSlots,
        maxSlots,
        apy,
        stakeRequired,
        availableOn: details?.availableOn ?? null,
        availableRewards,
        epoch,
        timeRemaining,
      };
    }) as StakingContract[];
  }, [
    nominees,
    cacheMap,
    subgraphMap,
    metadata,
    uncachedNominees,
    uncachedConfigByAccount,
    serviceIdsList,
    availableRewardsList,
    epochCounter,
    tsCheckpoint,
    blocks,
  ]);

  return {
    contracts,
    isLoading:
      isNomineesLoading ||
      isSubgraphLoading ||
      isMetadataLoading ||
      isMaxNumServicesLoading ||
      isServiceIdsLoading ||
      isRewardsPerSecondLoading ||
      isAvailableRewardsLoading ||
      isMinStakingDepositLoading ||
      isNumAgentInstancesLoading ||
      isEpochCounterLoading ||
      isLivenessPeriodLoading ||
      isTsCheckpointLoading ||
      areBlocksLoading,
  };
};
