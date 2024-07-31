import { ethers } from 'ethers';
import { Address } from 'viem';
import { useReadContract } from 'wagmi';

import { STAKING_TOKEN } from 'libs/util-contracts/src/lib/abiAndAddresses';

import { useAppSelector } from 'store/index';

const useStakingContractConstant = ({
  name,
  address,
  select,
}: {
  address: Address;
  name: string;
  select?: (data: unknown) => string;
}) => {
  const { networkId } = useAppSelector((state) => state.network);

  return useReadContract({
    address,
    abi: STAKING_TOKEN.abi,
    chainId: networkId as number,
    functionName: name,
    query: {
      enabled: !!networkId && !!address && !!name,
      select: select || ((data) => (typeof data === 'bigint' ? data.toString() : '0')),
    },
  });
};

export const useGetMinimumStakingDeposit = ({ address }: { address: Address }) =>
  useStakingContractConstant({
    address,
    name: 'minStakingDeposit',
    select: (data) => (typeof data === 'bigint' ? `${Number(ethers.formatEther(data))}` : '0'),
  });

export const useGetMinimumStakingPeriods = ({ address }: { address: Address }) =>
  useStakingContractConstant({ address, name: 'minStakingPeriods' });

export const useGetLivenessPeriod = ({ address }: { address: Address }) =>
  useStakingContractConstant({ address, name: 'livenessPeriod' });

export const useGetActivityChecker = ({ address }: { address: Address }) =>
  useStakingContractConstant({
    address,
    name: 'activityChecker',
    select: (data) => data as string,
  });

// export const useGetLivenessPeriod = ({ address }: { address: Address }) => {
//   const { networkId } = useAppSelector((state) => state.network);

//   return useReadContract({
//     address,
//     abi: STAKING_TOKEN.abi,
//     chainId: networkId as number,
//     functionName: 'livenessPeriod',
//     query: {
//       enabled: !!networkId,
//       select: (data) => (typeof data === 'bigint' ? data.toString() : '0'),
//     },
//   });
// };
