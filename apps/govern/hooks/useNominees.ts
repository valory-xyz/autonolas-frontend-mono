import { ethers } from 'ethers';
import { useReadContract } from 'wagmi';

import { VOTE_WEIGHTING } from 'libs/util-contracts/src/lib/abiAndAddresses';

export const useNominees = () => {
  const { data } = useReadContract({
    address: (VOTE_WEIGHTING.addresses as Record<number, `0x${string}`>)[1],
    abi: VOTE_WEIGHTING.abi,
    chainId: 1,
    functionName: 'getAllNominees',
    query: {
      select: (data) =>
        (data as { account: `0x${string}`; chainId: number }[]).filter(
          (item) => item.account !== ethers.zeroPadValue(ethers.ZeroAddress, 32),
        ),
    },
  });

  return { data };
};
