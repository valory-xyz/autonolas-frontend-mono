import { getPublicClient } from '@wagmi/core';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ContractCacheSnapshot, Nominee, StakingContract } from 'types';
import { Abi, Address, Block, formatEther, formatUnits } from 'viem';
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

const ONE_YEAR = 1 * 24 * 60 * 60 * 365;

type StakingContractDetailsInfo = {
  availableOn?: StakingContract['availableOn'];
  minOperatingBalance?: number;
  minOperatingBalanceToken?: string;
  minOperatingBalanceHint?: string;
};

const STAKING_CONTRACT_DETAILS: Record<Address, StakingContractDetailsInfo> = {
  // Quickstart Beta - Hobbyist
  '0x000000000000000000000000389b46c259631acd6a69bde8b6cee218230bae8c': {
    availableOn: ['quickstart'],
    minOperatingBalance: 11.5,
    minOperatingBalanceToken: 'xDAI',
  },
  // Quickstart Beta - Expert
  '0x0000000000000000000000005344b7dd311e5d3dddd46a4f71481bd7b05aaa3e': {
    availableOn: ['quickstart'],
    minOperatingBalance: 90,
    minOperatingBalanceToken: 'xDAI',
  },
  // Quickstart Beta - Expert 2
  '0x000000000000000000000000b964e44c126410df341ae04b13ab10a985fe3513': {
    availableOn: ['quickstart'],
    minOperatingBalance: 90,
    minOperatingBalanceToken: 'xDAI',
  },
  // Quickstart Beta - Expert 3
  '0x00000000000000000000000080fad33cadb5f53f9d29f02db97d682e8b101618': {
    availableOn: ['quickstart'],
    minOperatingBalance: 90,
    minOperatingBalanceToken: 'xDAI',
  },
  // Quickstart Beta - Hobbyist 2
  '0x000000000000000000000000238eb6993b90a978ec6aad7530d6429c949c08da': {
    availableOn: ['quickstart'],
    minOperatingBalance: 45,
    minOperatingBalanceToken: 'xDAI',
  },
  // Optimus Alpha IV
  '0x0000000000000000000000006891cf116f9a3bdbd1e89413118ef81f69d298c3': {
    availableOn: ['pearl', 'quickstart'],
    minOperatingBalance: 0.11,
    minOperatingBalanceToken: 'ETH',
  },
  // Optimus Alpha (optimism)
  '0x00000000000000000000000088996bbde7f982d93214881756840ce2c77c4992': {
    availableOn: ['pearl', 'quickstart'],
    minOperatingBalance: 0.17,
    minOperatingBalanceToken: 'ETH',
    minOperatingBalanceHint: '(Total Various Chains)',
  },
  // Mech Service - Mech Marketplace
  '0x000000000000000000000000998defafd094817ef329f6dc79c703f1cf18bc90': {
    availableOn: null,
    minOperatingBalance: 45,
    minOperatingBalanceToken: 'xDAI',
  },
  // Quickstart Beta - Expert 4
  '0x000000000000000000000000ad9d891134443b443d7f30013c7e14fe27f2e029': {
    availableOn: ['quickstart'],
    minOperatingBalance: 135,
    minOperatingBalanceToken: 'xDAI',
  },
  // Quickstart Beta - Expert 5
  '0x000000000000000000000000e56df1e563de1b10715cb313d514af350d207212': {
    availableOn: ['quickstart'],
    minOperatingBalance: 135,
    minOperatingBalanceToken: 'xDAI',
  },
  // Optimus Alpha III
  '0x0000000000000000000000000f69f35652b1acdbd769049334f1ac580927e139': {
    availableOn: ['pearl', 'quickstart'],
    minOperatingBalance: 0.011,
    minOperatingBalanceToken: 'ETH',
  },
  // Optimus Alpha (mode)
  '0x0000000000000000000000005fc25f50e96857373c64dc0edb1abcbed4587e91': {
    availableOn: ['pearl', 'quickstart'],
    minOperatingBalance: 0.011,
    minOperatingBalanceToken: 'ETH',
  },
  // Quickstart Beta - Expert 6
  '0x0000000000000000000000002546214aee7eea4bee7689c81231017ca231dc93': {
    availableOn: ['quickstart'],
    minOperatingBalance: 90,
    minOperatingBalanceToken: 'xDAI',
  },
  // Quickstart Beta - Expert 7
  '0x000000000000000000000000d7a3c8b975f71030135f1a66e9e23164d54ff455': {
    availableOn: ['quickstart'],
    minOperatingBalance: 135,
    minOperatingBalanceToken: 'xDAI',
  },
  // Quickstart Beta - Expert 16
  '0x0000000000000000000000006c65430515c70a3f5e62107cc301685b7d46f991': {
    availableOn: ['quickstart'],
    minOperatingBalance: 135,
    minOperatingBalanceToken: 'xDAI',
  },
  // Quickstart Beta - Expert 15
  '0x00000000000000000000000088eb38ff79fba8c19943c0e5acfa67d5876adcc1': {
    availableOn: ['quickstart'],
    minOperatingBalance: 135,
    minOperatingBalanceToken: 'xDAI',
  },
  // Modius Alpha
  '0x000000000000000000000000534c0a05b6d4d28d5f3630d6d74857b253cf8332': {
    availableOn: ['pearl', 'quickstart'],
    minOperatingBalance: 0.011,
    minOperatingBalanceToken: 'ETH',
  },
  // Quickstart Beta - Expert 8
  '0x000000000000000000000000356c108d49c5eebd21c84c04e9162de41933030c': {
    availableOn: ['quickstart'],
    minOperatingBalance: 90,
    minOperatingBalanceToken: 'xDAI',
  },
  // Quickstart Beta - Expert 9
  '0x00000000000000000000000017dbae44bc5618cc254055b386a29576b4f87015': {
    availableOn: ['quickstart'],
    minOperatingBalance: 135,
    minOperatingBalanceToken: 'xDAI',
  },
  // Quickstart Beta - Expert 10
  '0x000000000000000000000000b0ef657b8302bd2c74b6e6d9b2b4b39145b19c6f': {
    availableOn: ['quickstart'],
    minOperatingBalance: 135,
    minOperatingBalanceToken: 'xDAI',
  },
  // Quickstart Beta - Expert 11
  '0x0000000000000000000000003112c1613eac3dbae3d4e38cef023eb9e2c91cf7': {
    availableOn: ['quickstart'],
    minOperatingBalance: 135,
    minOperatingBalanceToken: 'xDAI',
  },
  // Quickstart Beta - Expert 12
  '0x000000000000000000000000f4a75f476801b3fbb2e7093acdcc3576593cc1fc': {
    availableOn: ['quickstart'],
    minOperatingBalance: 135,
    minOperatingBalanceToken: 'xDAI',
  },
  // Optimus Alpha II
  '0x000000000000000000000000bca056952d2a7a8dd4a002079219807cfdf9fd29': {
    availableOn: ['pearl', 'quickstart'],
    minOperatingBalance: 0.03,
    minOperatingBalanceToken: 'ETH',
  },
  // MemeBase Alpha II
  '0x000000000000000000000000c653622fd75026a020995a1d8c8651316cbbc4da': {
    availableOn: ['pearl'],
    minOperatingBalance: 0.03,
    minOperatingBalanceToken: 'ETH',
  },
  // Quickstart Beta - Expert 17
  '0x0000000000000000000000001430107a785c3a36a0c1fc0ee09b9631e2e72aff': {
    availableOn: ['quickstart'],
    minOperatingBalance: 135,
    minOperatingBalanceToken: 'xDAI',
  },
  // Quickstart Beta - Expert 18
  '0x000000000000000000000000041e679d04fc0d4f75eb937dea729df09a58e454': {
    availableOn: ['quickstart'],
    minOperatingBalance: 135,
    minOperatingBalanceToken: 'xDAI',
  },
  // Modius Alpha II
  '0x000000000000000000000000ec013e68fe4b5734643499887941ec197fd757d0': {
    availableOn: ['pearl', 'quickstart'],
    minOperatingBalance: 0.011,
    minOperatingBalanceToken: 'ETH',
  },
  // Modius Alpha III
  '0x0000000000000000000000009034d0413d122015710f1744a19efb1d7c2ceb13': {
    availableOn: ['pearl', 'quickstart'],
    minOperatingBalance: 0.011,
    minOperatingBalanceToken: 'ETH',
  },
  // Modius Alpha IV
  '0x0000000000000000000000008bcadb2c291c159f9385964e5ed95a9887302862': {
    availableOn: ['pearl', 'quickstart'],
    minOperatingBalance: 0.011,
    minOperatingBalanceToken: 'ETH',
  },
  // MemeBase Beta I
  '0x0000000000000000000000006011e09e7c095e76980b22498d69df18eb62bed8': {
    availableOn: ['pearl'],
    minOperatingBalance: 0.03,
    minOperatingBalanceToken: 'ETH',
  },
  // MemeBase Beta II
  '0x000000000000000000000000fb7669c3adf673b3a545fa5acd987dbfda805e22': {
    availableOn: ['pearl'],
    minOperatingBalance: 0.03,
    minOperatingBalanceToken: 'ETH',
  },
  // MemeBase Beta III
  '0x000000000000000000000000ca61633b03c54f64b6a7f1f9a9c0a6feb231cc4d': {
    availableOn: ['pearl'],
    minOperatingBalance: 0.03,
    minOperatingBalanceToken: 'ETH',
  },
  // Contribute Beta I
  '0x000000000000000000000000e2e68ddafbdc0ae48e39cdd1e778298e9d865cf4': {
    availableOn: ['contribute'],
    minOperatingBalance: 0,
    minOperatingBalanceToken: 'ETH',
  },
  // Contribute Beta II
  '0x0000000000000000000000006ce93e724606c365fc882d4d6dfb4a0a35fe2387': {
    availableOn: ['contribute'],
    minOperatingBalance: 0,
    minOperatingBalanceToken: 'ETH',
  },
  // Contribute Beta III
  '0x00000000000000000000000028877ffc6583170a4c9ed0121fc3195d06fd3a26': {
    availableOn: ['contribute'],
    minOperatingBalance: 0,
    minOperatingBalanceToken: 'ETH',
  },
  // Agents.fun 1
  '0x0000000000000000000000002585e63df7bd9de8e058884d496658a030b5c6ce': {
    availableOn: ['pearl'],
    minOperatingBalance: 0.03,
    minOperatingBalanceToken: 'ETH',
  },
  // Agents.fun 2
  '0x00000000000000000000000026fa75ef9ccaa60e58260226a71e9d07564c01bf': {
    availableOn: ['pearl'],
    minOperatingBalance: 0.03,
    minOperatingBalanceToken: 'ETH',
  },
  // Agents.fun 3
  '0x0000000000000000000000004d4233ebf0473ca8f34d105a6256a2389176f0ce': {
    availableOn: ['pearl'],
    minOperatingBalance: 0.03,
    minOperatingBalanceToken: 'ETH',
  },
  // Quickstart Beta Mech MarketPlace - Expert 1
  '0x000000000000000000000000db9e2713c3da3c403f2ea6e570eb978b00304e9e': {
    availableOn: ['quickstart'],
    minOperatingBalance: 135,
    minOperatingBalanceToken: 'xDAI',
  },
  // Quickstart Beta Mech MarketPlace - Expert 2
  '0x0000000000000000000000001e90522b45c771dcf5f79645b9e96551d2ecaf62': {
    availableOn: ['quickstart'],
    minOperatingBalance: 135,
    minOperatingBalanceToken: 'xDAI',
  },
  // Quickstart Beta Mech MarketPlace - Expert 3
  '0x00000000000000000000000075eeca6207be98cac3fde8a20ecd7b01e50b3472': {
    availableOn: ['quickstart'],
    minOperatingBalance: 90,
    minOperatingBalanceToken: 'xDAI',
  },
  // Quickstart Beta Mech MarketPlace - Expert 4
  '0x0000000000000000000000009c7f6103e3a72e4d1805b9c683ea5b370ec1a99f': {
    availableOn: ['quickstart'],
    minOperatingBalance: 90,
    minOperatingBalanceToken: 'xDAI',
  },
  // Quickstart Beta Mech MarketPlace - Expert 5
  '0x000000000000000000000000cdc603e0ee55aae92519f9770f214b2be4967f7d': {
    availableOn: ['quickstart'],
    minOperatingBalance: 135,
    minOperatingBalanceToken: 'xDAI',
  },
  // Quickstart Beta Mech MarketPlace - Expert 6
  '0x00000000000000000000000022d6cd3d587d8391c3aae83a783f26c67ab54a85': {
    availableOn: ['quickstart'],
    minOperatingBalance: 135,
    minOperatingBalanceToken: 'xDAI',
  },
  // Quickstart Beta Mech MarketPlace - Expert 7
  '0x000000000000000000000000aaecdf4d0cbd6ca0622892ac6044472f3912a5f3': {
    availableOn: ['quickstart'],
    minOperatingBalance: 135,
    minOperatingBalanceToken: 'xDAI',
  },
  // Quickstart Beta Mech MarketPlace - Expert 8
  '0x000000000000000000000000168aed532a0cd8868c22fc77937af78b363652b1': {
    availableOn: ['quickstart'],
    minOperatingBalance: 135,
    minOperatingBalanceToken: 'xDAI',
  },
  // Quickstart Beta Mech MarketPlace - Expert 9
  '0x000000000000000000000000dda9cd214f12e7c2d58e871404a0a3b1177065c8': {
    availableOn: ['quickstart'],
    minOperatingBalance: 135,
    minOperatingBalanceToken: 'xDAI',
  },
  // Quickstart Beta Mech MarketPlace - Expert 10
  '0x00000000000000000000000053a38655b4e659ef4c7f88a26fbf5c67932c7156': {
    availableOn: ['quickstart'],
    minOperatingBalance: 135,
    minOperatingBalanceToken: 'xDAI',
  },
  // Quickstart Beta Mech MarketPlace - Expert 11
  '0x0000000000000000000000001eade40561c61fa7acc5d816b1fc55a8d9b58519': {
    availableOn: ['quickstart'],
    minOperatingBalance: 135,
    minOperatingBalanceToken: 'xDAI',
  },
  // Quickstart Beta Mech MarketPlace - Expert 12
  '0x00000000000000000000000099fe6b5c9980fc3a44b1dc32a76db6adfcf4c75e': {
    availableOn: ['quickstart'],
    minOperatingBalance: 135,
    minOperatingBalanceToken: 'xDAI',
  },
  // Pearl Beta Mech MarketPlace I
  '0x000000000000000000000000ab10188207ea030555f53c8a84339a92f473aa5e': {
    availableOn: ['pearl'],
    minOperatingBalance: 90,
    minOperatingBalanceToken: 'xDAI',
  },
  // Pearl Beta Mech MarketPlace II
  '0x0000000000000000000000008d7be092d154b01d404f1accfa22cef98c613b5d': {
    availableOn: ['pearl'],
    minOperatingBalance: 90,
    minOperatingBalanceToken: 'xDAI',
  },
  // Pearl Beta Mech MarketPlace III
  '0x0000000000000000000000009d00a0551f20979080d3762005c9b74d7aa77b85': {
    availableOn: ['pearl'],
    minOperatingBalance: 11.5,
    minOperatingBalanceToken: 'xDAI',
  },
  // Pearl Beta Mech MarketPlace IV
  '0x000000000000000000000000e2f80659db1069f3b6a08af1a62064190c119543': {
    availableOn: ['pearl'],
    minOperatingBalance: 11.5,
    minOperatingBalanceToken: 'xDAI',
  },
  // Pett.AI Agent Staking Contract
  '0x000000000000000000000000fa0ca3935758cb81d35a8f1395b9eb5a596ce301': {
    availableOn: ['pearl'],
    minOperatingBalanceToken: 'ETH',
  },
  // Pett.AI Agent Staking Contract 2
  '0x00000000000000000000000000d544c10bdc0e9b0a71ceaf52c1342bb8f21c1d': {
    availableOn: ['pearl'],
    minOperatingBalanceToken: 'ETH',
  },
};

const getApy = (
  rewardsPerSecond: bigint,
  minStakingDeposit: bigint,
  maxNumAgentInstances: bigint,
) => {
  if (!minStakingDeposit || !rewardsPerSecond) return null;

  const rewardsPerYear = rewardsPerSecond * BigInt(ONE_YEAR);
  const apy = (rewardsPerYear * BigInt(100)) / minStakingDeposit;
  return Number(apy) / (1 + Number(maxNumAgentInstances));
};

const getStakeRequired = (minStakingDeposit: bigint, numAgentInstances: bigint) => {
  if (!minStakingDeposit || !numAgentInstances) return null;

  return formatEther(minStakingDeposit + minStakingDeposit * numAgentInstances);
};

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

const getDate = (timeRemainingSeconds: number) => {
  const days = Math.floor(timeRemainingSeconds / 86400);
  const hours = Math.floor((timeRemainingSeconds % 86400) / 3600);
  const minutes = Math.floor((timeRemainingSeconds % 3600) / 60);
  return `${days}D ${hours}H ${minutes}M`;
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

  const nonSubgraphNominees = useMemo(
    () => nominees.filter((n) => !subgraphMap.get(n.account)),
    [nominees, subgraphMap],
  );
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
  // Get serviceIds via RPC only for nominees not on subgraph (subgraph has agentIds)
  const { data: serviceIdsList, isFetching: isServiceIdsLoading } = useContractDetails(
    nonSubgraphNominees,
    'getServiceIds',
  );
  // Get rewardsPerSecond (only for uncached)
  const { data: rewardsPerSecondList, isFetching: isRewardsPerSecondLoading } = useContractDetails(
    uncachedNominees,
    'rewardsPerSecond',
  );
  // Get available rewards via RPC only for nominees not on subgraph (subgraph has latest checkpoint)
  const { data: availableRewardsList, isFetching: isAvailableRewardsLoading } = useContractDetails(
    nonSubgraphNominees,
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

  /** Index of each nominee in nonSubgraphNominees (for RPC arrays when not using subgraph). */
  const nonSubgraphIndexByAccount = useMemo(
    () => new Map(nonSubgraphNominees.map((n, j) => [n.account, j])),
    [nonSubgraphNominees],
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
      nonSubgraphNominees.length === 0 ||
      (serviceIdsList != null &&
        serviceIdsList.length === nonSubgraphNominees.length &&
        availableRewardsList != null &&
        availableRewardsList.length === nonSubgraphNominees.length);

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
    const uncachedConfigReady =
      uncachedNominees.length === 0 ||
      (uncachedConfigByAccount.maxNumServices.size === uncachedNominees.length &&
        uncachedConfigByAccount.rewardsPerSecond.size === uncachedNominees.length &&
        uncachedConfigByAccount.minStakingDeposit.size === uncachedNominees.length &&
        uncachedConfigByAccount.numAgentInstances.size === uncachedNominees.length &&
        uncachedConfigByAccount.livenessPeriod.size === uncachedNominees.length);

    if (!metadataReady || !uncachedConfigReady) return [];

    return nominees.map((item, index) => {
      const subgraphRow = subgraphMap.get(item.account);
      const cached = cacheMap.get(item.account);
      const nonSubIdx = nonSubgraphIndexByAccount.get(item.account);

      const maxSlots = subgraphRow
        ? subgraphRow.maxNumServices
        : cached
          ? cached.data.config.maxNumServices
          : (uncachedConfigByAccount.maxNumServices.get(item.account) ?? 0);
      const servicesLength = subgraphRow
        ? subgraphRow.filledSlots
        : nonSubIdx != null
          ? ((serviceIdsList?.[nonSubIdx] as readonly bigint[] | undefined) ?? []).length
          : 0;
      const availableRewardsInWei = subgraphRow
        ? BigInt(subgraphRow.availableRewards)
        : nonSubIdx != null
          ? ((availableRewardsList?.[nonSubIdx] as bigint) ?? 0n)
          : 0n;
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
      const timeRemaining = getDate(timeRemainingSeconds);

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
        minOperatingBalance: details?.minOperatingBalance,
        minOperatingBalanceToken: details?.minOperatingBalanceToken ?? null,
        minOperatingBalanceHint: details?.minOperatingBalanceHint,
        availableRewards,
        epoch,
        timeRemaining,
      };
    }) as StakingContract[];
  }, [
    nominees,
    cacheMap,
    subgraphMap,
    nonSubgraphNominees,
    nonSubgraphIndexByAccount,
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
