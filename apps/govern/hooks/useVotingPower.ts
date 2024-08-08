import { ethers } from 'ethers';
import { Address } from 'viem';
import { mainnet } from 'viem/chains';
import { useReadContract } from 'wagmi';

import { VE_OLAS } from 'libs/util-contracts/src/lib/abiAndAddresses';

export const useVotingPower = (account: Address | undefined) => {
  const { data, isFetching, refetch } = useReadContract({
    address: (VE_OLAS.addresses as Record<number, Address>)[mainnet.id],
    abi: VE_OLAS.abi,
    functionName: 'getVotes',
    chainId: mainnet.id,
    args: [account],
    query: {
      enabled: !!account,
      select: (data) => ethers.formatUnits(data as string, 18),
    },
  });

  return { data, isFetching, refetch };
};
