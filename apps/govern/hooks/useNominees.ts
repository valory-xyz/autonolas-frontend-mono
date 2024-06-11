import { ethers } from 'ethers';
import { Address } from 'types/index';
import { useReadContract } from 'wagmi';

import { VOTE_WEIGHTING } from 'libs/util-contracts/src/lib/abiAndAddresses';

import { getBytes32FromAddress } from 'common-util/functions';

export const useNominees = () => {
  const { data } = useReadContract({
    address: (VOTE_WEIGHTING.addresses as Record<number, Address>)[1],
    abi: VOTE_WEIGHTING.abi,
    chainId: 1,
    functionName: 'getAllNominees',
    query: {
      select: (data) =>
        (data as { account: Address; chainId: number }[]).filter(
          (item) => item.account !== getBytes32FromAddress(ethers.ZeroAddress),
        ),
    },
  });

  return { data };
};
