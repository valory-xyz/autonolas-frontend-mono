import { ethers } from 'ethers';
import { Address } from 'viem';
import { useReadContract } from 'wagmi';

import { STAKING_FACTORY, STAKING_VERIFIER } from 'libs/util-contracts/src/lib/abiAndAddresses';

import { useAppSelector } from 'store/index';

export const useStakingContractVerifierHelper = <T>({
  name = 'timeForEmissionsLimit',
  select,
}: {
  name: string;
  select: (data: unknown) => T;
}) => {
  const { networkId } = useAppSelector((state) => state.network);

  const { data: verifierAddress } = useReadContract({
    address: (STAKING_FACTORY.addresses as Record<number, Address>)[networkId as number],
    abi: STAKING_FACTORY.abi,
    chainId: networkId as number,
    functionName: 'verifier',
  });

  const { data, isLoading } = useReadContract({
    address: verifierAddress as Address,
    abi: STAKING_VERIFIER.abi,
    chainId: networkId as number,
    functionName: name,
    query: {
      enabled: !!verifierAddress,
      select,
    },
  });

  return { data, isLoading };
};

export const useNumServicesLimit = () =>
  useStakingContractVerifierHelper<number>({
    name: 'numServicesLimit',
    select: (data) => {
      if (typeof data === 'bigint') return Number(data);
      return 0;
    },
  });

export const useMinStakingDepositLimit = () =>
  useStakingContractVerifierHelper<number>({
    name: 'minStakingDepositLimit',
    select: (data) => {
      if (typeof data === 'bigint') return Number(ethers.formatEther(data));
      return 0;
    },
  });

export const useTimeForEmissionsLimit = () =>
  useStakingContractVerifierHelper<number>({
    name: 'timeForEmissionsLimit',
    select: (data) => {
      if (typeof data === 'bigint') return Number(data);
      return 0;
    },
  });
