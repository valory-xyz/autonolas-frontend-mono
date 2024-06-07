import { ethers } from 'ethers';
import { useReadContract } from 'wagmi';

import { VE_OLAS } from 'libs/util-contracts/src/lib/abiAndAddresses';

export const useVotingPower = (account: `0x${string}` | undefined) => {
  const { data, isFetching } = useReadContract({
    address: (VE_OLAS.addresses as Record<number, `0x${string}`>)[1],
    abi: VE_OLAS.abi,
    functionName: 'getVotes',
    chainId: 1,
    args: [account],
    query: {
      enabled: !!account,
      select: (data) => {
        const formatted = ethers.formatUnits(data as string, 18);
        const [integer, decimal] = formatted.split('.');

        // TODO: come up with better rounding
        return decimal ? `${integer}.${decimal.slice(0, 2)}` : integer;
      },
    },
  });

  return { data: 0, isFetching };
};
