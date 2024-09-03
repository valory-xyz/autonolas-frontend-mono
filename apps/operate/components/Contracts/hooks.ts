import { useMemo } from 'react';
import { StakingContract } from 'types';
import { Abi, Address, formatEther } from 'viem';
import { useReadContracts } from 'wagmi';

import { useNominees, useNomineesMetadata } from 'libs/common-contract-functions/src';
import { RETAINER_ADDRESS } from 'libs/util-constants/src';
import { STAKING_TOKEN } from 'libs/util-contracts/src';
import { getAddressFromBytes32, getBytes32FromAddress } from 'libs/util-functions/src';

const ONE_YEAR = 1 * 24 * 60 * 60 * 365;

type StakingContractDetailsInfo = {
  availableOn: StakingContract['availableOn'];
  minOperatingBalance?: number;
  minOperatingBalanceToken?: string;
};

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
    (nominee) => nominee.account !== getBytes32FromAddress(RETAINER_ADDRESS),
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
      !!minStakingDepositList &&
      !!numAgentInstancesList
    ) {
      return nominees.map((item, index) => {
        const maxSlots = Number(maxNumServicesList[index]);
        const servicesLength = ((serviceIdsList[index] as string[]) || []).length;
        const availableSlots = maxSlots > 0 && servicesLength > 0 ? maxSlots - servicesLength : 0;
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
          availableOn: details.availableOn || null,
          minOperatingBalanceRequired: details.minOperatingBalance
            ? `${details.minOperatingBalance} ${details.minOperatingBalanceToken}`
            : null,
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
  ]);

  return {
    contracts,
    isLoading:
      isNomineesLoading ||
      isMetadataLoading ||
      isMaxNumServicesLoading ||
      isServiceIdsLoading ||
      isRewardsPerSecondLoading ||
      isMinStakingDepositLoading ||
      isNumAgentInstancesLoading,
  };
};
