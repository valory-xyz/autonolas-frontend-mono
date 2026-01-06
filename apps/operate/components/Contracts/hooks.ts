import { getPublicClient } from '@wagmi/core';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Nominee, StakingContract } from 'types';
import { Abi, Address, Block, formatEther, formatUnits } from 'viem';
import { getBlock } from 'viem/actions';
import { useReadContracts } from 'wagmi';

import { useNominees, useNomineesMetadata } from 'libs/common-contract-functions/src';
import { RETAINER_ADDRESS } from 'libs/util-constants/src';
import { STAKING_TOKEN } from 'libs/util-contracts/src';
import { areAddressesEqual, getAddressFromBytes32 } from 'libs/util-functions/src';

import { wagmiConfig } from 'common-util/config/wagmi';

const ONE_YEAR = 1 * 24 * 60 * 60 * 365;

type StakingContractDetailsInfo = {
  availableOn?: StakingContract['availableOn'];
  minOperatingBalance?: number;
  minOperatingBalanceToken?: string;
  minOperatingBalanceHint?: string;
};

const BLACKLISTED_ADDRESSES = [
  RETAINER_ADDRESS,
  // Broken contribute staking contracts
  '0x95146adf659f455f300d7521b3b62a3b6c4aba1f',
  '0x2c8a5ac7b431ce04a037747519ba475884bce2fb',
  '0x708e511d5fcb3bd5a5d42f42aa9a69ec5b0ee2e8',
];

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
  return `${days}d ${hours}h ${minutes}m`;
};

export const useStakingContractsList = () => {
  // Get nominees list
  const { data: nomineesData, isFetching: isNomineesLoading } = useNominees();
  const nominees = useMemo(() => {
    return (nomineesData || []).filter(
      (nominee) =>
        !BLACKLISTED_ADDRESSES.some((blackListedNominee) =>
          areAddressesEqual(blackListedNominee, getAddressFromBytes32(nominee.account)),
        ),
    );
  }, [nomineesData]);

  // Fetch blocks for each nominee's chain ID
  const { blocks, isLoading: areBlocksLoading } = useBlocksForNominees(nominees);

  // Get contracts metadata
  const { data: metadata, isLoading: isMetadataLoading } = useNomineesMetadata(nominees);
  // Get maxNumServices
  const { data: maxNumServicesList, isFetching: isMaxNumServicesLoading } = useContractDetails(
    nominees,
    'maxNumServices',
  );
  // Get serviceIds
  const { data: serviceIdsList, isFetching: isServiceIdsLoading } = useContractDetails(
    nominees,
    'getServiceIds',
  );
  // Get rewardsPerSecond
  const { data: rewardsPerSecondList, isFetching: isRewardsPerSecondLoading } = useContractDetails(
    nominees,
    'rewardsPerSecond',
  );
  // Get available rewards
  const { data: availableRewardsList, isFetching: isAvailableRewardsLoading } = useContractDetails(
    nominees,
    'availableRewards',
  );
  // Get minStakingDeposit
  const { data: minStakingDepositList, isFetching: isMinStakingDepositLoading } =
    useContractDetails(nominees, 'minStakingDeposit');
  // Get numAgentInstances
  const { data: numAgentInstancesList, isFetching: isNumAgentInstancesLoading } =
    useContractDetails(nominees, 'numAgentInstances');

  // Get epochCounter
  const { data: epochCounter, isFetching: isEpochCounterLoading } = useContractDetails(
    nominees,
    'epochCounter',
  );

  // Get livenessPeriod
  const { data: livenessPeriod, isFetching: isLivenessPeriodLoading } = useContractDetails(
    nominees,
    'livenessPeriod',
  );

  // Get tsCheckpoint
  const { data: tsCheckpoint, isFetching: isTsCheckpointLoading } = useContractDetails(
    nominees,
    'tsCheckpoint',
  );

  /**
   * Sets staking contracts list to the store
   **/
  const contracts = useMemo(() => {
    if (
      // Check if all data is loaded
      !!nominees &&
      !!metadata &&
      !!maxNumServicesList &&
      !!serviceIdsList &&
      !!rewardsPerSecondList &&
      !!availableRewardsList &&
      !!minStakingDepositList &&
      !!numAgentInstancesList &&
      !!epochCounter &&
      !!livenessPeriod &&
      !!tsCheckpoint &&
      !!blocks
    ) {
      return nominees.map((item, index) => {
        const maxSlots = Number(maxNumServicesList[index]);
        const servicesLength = ((serviceIdsList[index] as string[]) || []).length;
        const availableRewardsInWei = availableRewardsList[index];
        const availableSlots =
          (availableRewardsInWei as bigint) > 0 && maxSlots > 0 ? maxSlots - servicesLength : 0;
        const rewardsPerSecond = rewardsPerSecondList[index] as bigint;
        const minStakingDeposit = minStakingDepositList[index] as bigint;
        const numAgentInstances = (numAgentInstancesList[index] || 1n) as bigint;

        const availableRewards =
          availableRewardsInWei != null ? formatUnits(availableRewardsInWei as bigint, 18) : '0';

        const apy = getApy(rewardsPerSecond, minStakingDeposit, numAgentInstances);
        const stakeRequired = getStakeRequired(minStakingDeposit, numAgentInstances);
        const details = STAKING_CONTRACT_DETAILS[item.account];
        const epoch = Number(epochCounter[index]);
        const livenessPeriodSeconds = Number(livenessPeriod[index]);
        const tsCheckpointSeconds = Number(tsCheckpoint[index]);

        // Get the block for this contract's specific chain
        const contractBlock = blocks.get(item.chainId.toString());

        // Calculate time remaining using the block from the contract's chain
        const timeRemainingSeconds = contractBlock
          ? livenessPeriodSeconds - (Number(contractBlock.timestamp) - tsCheckpointSeconds)
          : 0;
        const timeRemaining = getDate(timeRemainingSeconds);

        return {
          key: item.account,
          address: item.account,
          chainId: Number(item.chainId),
          metadata: metadata[item.account],
          availableSlots,
          maxSlots,
          apy,
          stakeRequired,
          availableOn: details?.availableOn || null,
          minOperatingBalance: details?.minOperatingBalance,
          minOperatingBalanceToken: details?.minOperatingBalanceToken || null,
          minOperatingBalanceHint: details?.minOperatingBalanceHint || null,
          availableRewards,
          epoch,
          timeRemaining,
        };
      }) as StakingContract[];
    }
    return [];
  }, [
    nominees,
    metadata,
    maxNumServicesList,
    serviceIdsList,
    rewardsPerSecondList,
    availableRewardsList,
    minStakingDepositList,
    numAgentInstancesList,
    epochCounter,
    livenessPeriod,
    tsCheckpoint,
    blocks,
  ]);

  return {
    contracts,
    isLoading:
      isNomineesLoading ||
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
