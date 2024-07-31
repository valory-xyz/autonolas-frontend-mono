// import { ethers } from 'ethers';
import { Address } from 'viem';
import { useReadContract } from 'wagmi';

import { STAKING_TOKEN } from 'libs/util-contracts/src/lib/abiAndAddresses';

import { useAppSelector } from 'store/index';

const useStakingContractConstant = ({ name, address }: { address: Address; name: string }) => {
  const { networkId } = useAppSelector((state) => state.network);

  return useReadContract({
    address,
    abi: STAKING_TOKEN.abi,
    chainId: networkId as number,
    functionName: name,
    query: {
      enabled: !!networkId && !!address && !!name,
      select: (data) => (typeof data === 'bigint' ? data.toString() : '0'),
    },
  });
};

export const useGetLivenessPeriod = ({ address }: { address: Address }) =>
  useStakingContractConstant({ address, name: 'livenessPeriod' });

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
