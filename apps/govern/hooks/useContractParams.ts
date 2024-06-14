import { useReadContract } from 'wagmi';

import { STAKING_FACTORY } from 'libs/util-contracts/src/lib/abiAndAddresses';

import { Address } from 'types/index';

export const useContractParams = (address: string, chainId: number) => {
  const { data } = useReadContract({
    address: (STAKING_FACTORY.addresses as Record<number, Address>)[chainId],
    abi: STAKING_FACTORY.abi,
    chainId,
    functionName: 'mapInstanceParams',
    args: [address],
    query: {
      select: (data) => {
        const [implementation, deployer, isEnabled] = data as [Address, Address, boolean];
        return { implementation, deployer, isEnabled };
      },
    },
  });

  return { data };
};
