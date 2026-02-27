import { Address, formatEther } from 'viem';
import { useReadContract } from 'wagmi';

import { STAKING_FACTORY, STAKING_TOKEN } from 'libs/util-contracts/src/lib/abiAndAddresses';

export const useContractParams = (address: string, chainId: number) => {
  const { data } = useReadContract({
    address: (STAKING_FACTORY.addresses as Record<number, Address>)[chainId],
    abi: STAKING_FACTORY.abi,
    chainId,
    functionName: 'mapInstanceParams',
    args: [address],
    query: {
      select: (data) => {
        const [implementation, deployer, isEnabled] = data as [Address, Address, boolean];
        return { implementation, deployer, isEnabled };
      },
    },
  });

  return { data };
};

type UseStakingContractConstantParams = {
  address: Address;
  chainId: number;
};

const useStakingContractConstant = <T>({
  name,
  address,
  chainId,
  select,
}: {
  address: Address;
  chainId: number;
  name: string;
  select?: (data: unknown) => T;
}) => {
  return useReadContract({
    address,
    abi: STAKING_TOKEN.abi,
    chainId,
    functionName: name,
    query: {
      enabled: !!chainId && !!address && !!name,
      select:
        select ||
        (((data) => {
          if (typeof data === 'bigint') return data.toString();
          return data || '0';
        }) as (data: unknown) => T),
    },
  });
};

export const useMaxNumServices = ({ address, chainId }: UseStakingContractConstantParams) =>
  useStakingContractConstant<string>({
    address,
    chainId,
    name: 'maxNumServices',
  });

export const useRewardsPerSecond = ({ address, chainId }: UseStakingContractConstantParams) =>
  useStakingContractConstant({
    address,
    chainId,
    name: 'rewardsPerSecond',
    select: (data) => (typeof data === 'bigint' ? `${Number(formatEther(data))}` : '0'),
  });

export const useGetMinimumStakingDeposit = ({
  address,
  chainId,
}: UseStakingContractConstantParams) =>
  useStakingContractConstant({
    address,
    chainId,
    name: 'minStakingDeposit',
    select: (data) => (typeof data === 'bigint' ? `${Number(formatEther(data))}` : '0'),
  });

export const useGetMinimumStakingDuration = ({
  address,
  chainId,
}: UseStakingContractConstantParams) =>
  useStakingContractConstant<string>({ address, chainId, name: 'minStakingDuration' });

export const useGetMaximumInactivityPeriods = ({
  address,
  chainId,
}: UseStakingContractConstantParams) =>
  useStakingContractConstant<string>({ address, chainId, name: 'maxNumInactivityPeriods' });

export const useGetLivenessPeriod = ({ address, chainId }: UseStakingContractConstantParams) =>
  useStakingContractConstant<string>({ address, chainId, name: 'livenessPeriod' });

export const useTimeForEmissions = ({ address, chainId }: UseStakingContractConstantParams) =>
  useStakingContractConstant<string>({ address, chainId, name: 'timeForEmissions' });

export const useNumberOfAgentInstances = ({ address, chainId }: UseStakingContractConstantParams) =>
  useStakingContractConstant<string>({ address, chainId, name: 'numAgentInstances' });

export const useGetAgentIds = ({ address, chainId }: UseStakingContractConstantParams) =>
  useStakingContractConstant<string[]>({
    address,
    chainId,
    name: 'getAgentIds',
    select: (data) => {
      const ids = data as bigint[];
      return ids.map((id) => id.toString());
    },
  });

export const useGetMultisigThreshold = ({ address, chainId }: UseStakingContractConstantParams) =>
  useStakingContractConstant<string>({ address, chainId, name: 'threshold' });

export const useGetConfigHash = ({ address, chainId }: UseStakingContractConstantParams) =>
  useStakingContractConstant<string>({ address, chainId, name: 'configHash' });

export const useGetProxyHash = ({ address, chainId }: UseStakingContractConstantParams) =>
  useStakingContractConstant<string>({ address, chainId, name: 'proxyHash' });

export const useGetActivityChecker = ({ address, chainId }: UseStakingContractConstantParams) =>
  useStakingContractConstant({ address, chainId, name: 'activityChecker' });
