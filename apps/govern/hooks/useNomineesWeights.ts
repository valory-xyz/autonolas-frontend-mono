import { Abi } from 'viem';
import { useReadContracts } from 'wagmi';

import { VOTE_WEIGHTING } from 'libs/util-contracts/src/lib/abiAndAddresses';

export const useNomineesWeights = (
  nominees: { account: `0x${string}`; chainId: string }[],
  timestamp: number,
) => {
  const contracts = nominees.map((nominee) => ({
    address: (VOTE_WEIGHTING.addresses as Record<number, `0x${string}`>)[1],
    abi: VOTE_WEIGHTING.abi as Abi,
    functionName: 'nomineeRelativeWeight',
    args: [nominee.account, nominee.chainId, timestamp],
  }));

  const { data, isFetching } = useReadContracts({
    contracts,
    query: {
      enabled: nominees.length > 0 && timestamp !== undefined,
      // TODO: move to global config?
      staleTime: Infinity,
    },
  });

  return { data, isFetching };
};
