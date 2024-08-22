import { ethers } from 'ethers';
import { Address } from 'viem';
import { mainnet } from 'viem/chains';
import { useReadContract } from 'wagmi';

import { VOTE_WEIGHTING } from 'libs/util-contracts/src';
import { getBytes32FromAddress } from 'libs/util-functions/src';

export const useNominees = () => {
  const { data, isFetching } = useReadContract({
    address: (VOTE_WEIGHTING.addresses as Record<number, Address>)[mainnet.id],
    abi: VOTE_WEIGHTING.abi,
    chainId: mainnet.id,
    functionName: 'getAllNominees',
    query: {
      select: (data) =>
        (data as { account: Address; chainId: number }[]).filter(
          (item) => item.account !== getBytes32FromAddress(ethers.ZeroAddress),
        ),
    },
  });

  return { data, isFetching };
};
