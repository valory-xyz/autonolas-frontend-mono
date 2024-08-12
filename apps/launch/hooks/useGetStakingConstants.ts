import { Address, formatEther } from 'viem';
import { useReadContract } from 'wagmi';

import { STAKING_TOKEN } from 'libs/util-contracts/src/lib/abiAndAddresses';

import { useAppSelector } from 'store/index';

const useStakingContractConstant = <T>({
  name,
  address,
  args,
  select,
}: {
  address: Address;
  name: string;
  args?: unknown[];
  select?: (data: unknown) => T;
}) => {
  const { networkId } = useAppSelector((state) => state.network);

  return useReadContract({
    address,
    abi: STAKING_TOKEN.abi,
    chainId: networkId as number,
    functionName: name,
    args,
    query: {
      enabled: !!networkId && !!address && !!name,
      select:
        select ||
        (((data) => {
          if (typeof data === 'bigint') return data.toString();
          return data || '0';
        }) as (data: unknown) => T),
    },
  });
};

export const useMaxNumServices = ({ address }: { address: Address }) =>
  useStakingContractConstant<string>({
    address,
    name: 'maxNumServices',
  });

export const useRewardsPerSecond = ({ address }: { address: Address }) =>
  useStakingContractConstant({
    address,
    name: 'rewardsPerSecond',
    select: (data) => (typeof data === 'bigint' ? `${Number(formatEther(data))}` : '0'),
  });

export const useGetMinimumStakingDeposit = ({ address }: { address: Address }) =>
  useStakingContractConstant({
    address,
    name: 'minStakingDeposit',
    select: (data) => (typeof data === 'bigint' ? `${Number(formatEther(data))}` : '0'),
  });

export const useGetMinimumStakingDuration = ({ address }: { address: Address }) =>
  useStakingContractConstant<string>({ address, name: 'minStakingDuration' });

export const useGetMaximumInactivityPeriods = ({ address }: { address: Address }) =>
  useStakingContractConstant<string>({ address, name: 'maxNumInactivityPeriods' });

export const useGetLivenessPeriod = ({ address }: { address: Address }) =>
  useStakingContractConstant<string>({ address, name: 'livenessPeriod' });

export const useTimeForEmissions = ({ address }: { address: Address }) =>
  useStakingContractConstant<string>({ address, name: 'timeForEmissions' });

export const useNumberOfAgentInstances = ({ address }: { address: Address }) =>
  useStakingContractConstant<string>({ address, name: 'numAgentInstances' });

export const useGetAgentIds = ({ address }: { address: Address }) =>
  useStakingContractConstant<string[]>({
    address,
    name: 'getAgentIds',
    select: (data) => {
      const ids = data as bigint[];
      return ids.map((id) => id.toString());
    },
  });

export const useGetMultisigThreshold = ({ address }: { address: Address }) =>
  useStakingContractConstant<string>({ address, name: 'threshold' });

export const useGetConfigHash = ({ address }: { address: Address }) =>
  useStakingContractConstant<string>({ address, name: 'configHash' });

export const useGetActivityChecker = ({ address }: { address: Address }) =>
  useStakingContractConstant({ address, name: 'activityChecker' });
