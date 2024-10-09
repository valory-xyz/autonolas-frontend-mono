import { useMemo } from 'react';
import { StakingContract } from 'types';
import { Abi, Address, formatEther } from 'viem';
import { useReadContracts } from 'wagmi';

import { useNominees, useNomineesMetadata } from 'libs/common-contract-functions/src';
import { RETAINER_ADDRESS } from 'libs/util-constants/src';
import { STAKING_TOKEN } from 'libs/util-contracts/src';
import { areAddressesEqual, getAddressFromBytes32 } from 'libs/util-functions/src';

const ONE_YEAR = 1 * 24 * 60 * 60 * 365;

type StakingContractDetailsInfo = {
  availableOn?: StakingContract['availableOn'];
  minOperatingBalance?: number;
  minOperatingBalanceToken?: string;
  minOperatingBalanceHint?: string;
};

const BLACKLISTED_ADDRESSES = [RETAINER_ADDRESS];

const STAKING_CONTRACT_DETAILS: Record<Address, StakingContractDetailsInfo> = {
  '0x000000000000000000000000ef44fb0842ddef59d37f85d61a1ef492bba6135d': {
    availableOn: 'pearl',
    minOperatingBalance: 11.5,
    minOperatingBalanceToken: 'xDAI',
  },
  '0x000000000000000000000000389b46c259631acd6a69bde8b6cee218230bae8c': {
    availableOn: 'quickstart',
    minOperatingBalance: 90,
    minOperatingBalanceToken: 'xDAI',
  },
  '0x0000000000000000000000005344b7dd311e5d3dddd46a4f71481bd7b05aaa3e': {
    availableOn: 'quickstart',
    minOperatingBalance: 90,
    minOperatingBalanceToken: 'xDAI',
  },
  '0x000000000000000000000000b964e44c126410df341ae04b13ab10a985fe3513': {
    availableOn: 'quickstart',
    minOperatingBalance: 90,
    minOperatingBalanceToken: 'xDAI',
  },
  '0x00000000000000000000000080fad33cadb5f53f9d29f02db97d682e8b101618': {
    availableOn: 'quickstart',
    minOperatingBalance: 90,
    minOperatingBalanceToken: 'xDAI',
  },
  '0x0000000000000000000000001c2f82413666d2a3fd8bc337b0268e62ddf67434': {
    availableOn: 'pearl',
    minOperatingBalance: 11.5,
    minOperatingBalanceToken: 'xDAI',
  },
  '0x000000000000000000000000238eb6993b90a978ec6aad7530d6429c949c08da': {
    availableOn: 'quickstart',
    minOperatingBalance: 45,
    minOperatingBalanceToken: 'xDAI',
  },
  '0x00000000000000000000000088996bbde7f982d93214881756840ce2c77c4992': {
    availableOn: 'optimusQuickstart',
    minOperatingBalance: 0.17,
    minOperatingBalanceToken: 'ETH',
    minOperatingBalanceHint: '(Total Various Chains)',
  },
  '0x000000000000000000000000daf34ec46298b53a3d24cbcb431e84ebd23927da': {
    availableOn: null,
    minOperatingBalance: 11.5,
    minOperatingBalanceToken: 'xDAI',
  },
  '0x000000000000000000000000998defafd094817ef329f6dc79c703f1cf18bc90': {
    availableOn: null,
    minOperatingBalance: 45,
    minOperatingBalanceToken: 'xDAI',
  },
  '0x000000000000000000000000ad9d891134443b443d7f30013c7e14fe27f2e029': {
    availableOn: 'quickstart',
    minOperatingBalance: 135,
    minOperatingBalanceToken: 'xDAI',
  },
  '0x000000000000000000000000e56df1e563de1b10715cb313d514af350d207212': {
    availableOn: 'quickstart',
    minOperatingBalance: 135,
    minOperatingBalanceToken: 'xDAI',
  },
};

const getApy = (
  rewardsPerSecond: bigint,
  minStakingDeposit: bigint,
  maxNumAgentInstances: bigint,
) => {
  const rewardsPerYear = rewardsPerSecond * BigInt(ONE_YEAR);
  const apy = (rewardsPerYear * BigInt(100)) / minStakingDeposit;
  return Number(apy) / (1 + Number(maxNumAgentInstances));
};

const getStakeRequired = (minStakingDeposit: bigint, numAgentInstances: bigint) => {
  return formatEther(minStakingDeposit + minStakingDeposit * numAgentInstances);
};

const useContractDetails = (
  nominees: { account: Address; chainId: number }[],
  functionName: string,
) => {
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

export const useStakingContractsList = () => {
  // Get nominees list
  const { data: nomineesData, isFetching: isNomineesLoading } = useNominees();
  const nominees = (nomineesData || []).filter(
    (nominee) =>
      !BLACKLISTED_ADDRESSES.some((blackListedNominee) =>
        areAddressesEqual(blackListedNominee, getAddressFromBytes32(nominee.account)),
      ),
  );

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
      !!numAgentInstancesList
    ) {
      return nominees.map((item, index) => {
        const maxSlots = Number(maxNumServicesList[index]);
        const servicesLength = ((serviceIdsList[index] as string[]) || []).length;
        const availableRewards = availableRewardsList[index] as bigint;
        const availableSlots = availableRewards > 0 && maxSlots > 0 ? maxSlots - servicesLength : 0;
        const rewardsPerSecond = rewardsPerSecondList[index] as bigint;
        const minStakingDeposit = minStakingDepositList[index] as bigint;
        const numAgentInstances = numAgentInstancesList[index] as bigint;

        const apy = getApy(rewardsPerSecond, minStakingDeposit, numAgentInstances);
        const stakeRequired = getStakeRequired(minStakingDeposit, numAgentInstances);
        const details = STAKING_CONTRACT_DETAILS[item.account];

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
    minStakingDepositList,
    numAgentInstancesList,
    availableRewardsList,
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
      isNumAgentInstancesLoading,
  };
};
