import { ethers } from 'ethers';
import { Address } from 'viem';
import { useReadContract } from 'wagmi';

import { STAKING_TOKEN } from 'libs/util-contracts/src/lib/abiAndAddresses';

import { useAppSelector } from 'store/index';

export const useMaxNumServices = ({ address }: { address: Address }) => {
  const { networkId } = useAppSelector((state) => state.network);

  return useReadContract({
    address,
    abi: STAKING_TOKEN.abi,
    chainId: networkId as number,
    functionName: 'maxNumServices',
    query: {
      enabled: !!networkId,
      select: (data) => (typeof data === 'bigint' ? data.toString() : '0'),
    },
  });
};

export const useRewardsPerSecond = ({ address }: { address: Address }) => {
  const { networkId } = useAppSelector((state) => state.network);

  return useReadContract({
    address,
    abi: STAKING_TOKEN.abi,
    chainId: networkId as number,
    functionName: 'rewardsPerSecond',
    query: {
      enabled: !!networkId,
      select: (data) => (typeof data === 'bigint' ? ethers.formatEther(data) : '0'),
    },
  });
};
