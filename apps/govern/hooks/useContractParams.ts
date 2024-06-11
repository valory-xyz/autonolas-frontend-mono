import { useReadContract } from 'wagmi';

import { STAKING_FACTORY } from 'libs/util-contracts/src/lib/abiAndAddresses';

export const useContractParams = (address: string, chainId: number, enabled: boolean) => {
  const { data } = useReadContract({
    address: (STAKING_FACTORY.addresses as Record<number, `0x${string}`>)[chainId],
    abi: STAKING_FACTORY.abi,
    chainId,
    functionName: 'mapInstanceParams',
    args: [address],
    query: {
      enabled,
      select: (data) => {
        const [implementation, deployer, isEnabled] = data as [
          `0x${string}`,
          `0x${string}`,
          boolean,
        ];
        return { implementation, deployer, isEnabled };
      },
    },
  });

  return { data };
};
