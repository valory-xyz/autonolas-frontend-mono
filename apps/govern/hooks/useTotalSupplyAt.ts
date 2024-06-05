import { VE_OLAS } from 'libs/util-contracts/src/lib/abiAndAddresses';
import { useReadContract } from 'wagmi';

// PROBABLY NOT NEEDED
export const useTotalSupplyAt = (
  timestamp: number | null,
) => {
    const { data, isFetching } = useReadContract({
        address: (VE_OLAS.addresses as Record<number, `0x${string}`>)[1],
        abi: VE_OLAS.abi,
        functionName: 'totalSupplyLockedAtT',
        args: [timestamp],
        query: {
            enabled: timestamp !== null,
          // TODO: move to global config?
          staleTime: Infinity,
        },
      });

  return { data: data as number, isFetching };
};
