import { ethers } from 'ethers';
import { Address } from 'types/index';
import { useReadContract } from 'wagmi';

import { VE_OLAS } from 'libs/util-contracts/src/lib/abiAndAddresses';

export const useVotingPower = (account: Address | undefined) => {
  const { data, isFetching } = useReadContract({
    address: (VE_OLAS.addresses as Record<number, Address>)[1],
    abi: VE_OLAS.abi,
    functionName: 'getVotes',
    chainId: 1,
    args: [account],
    query: {
      enabled: !!account,
      select: (data) => ethers.formatUnits(data as string, 18),
    },
  });

  return { data, isFetching };
};
