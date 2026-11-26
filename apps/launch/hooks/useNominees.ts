import { Abi, Address } from 'viem';
import { mainnet } from 'viem/chains';
import { useReadContract } from 'wagmi';

import { VOTE_WEIGHTING } from 'libs/util-contracts/src/lib/abiAndAddresses';

export type Nominee = { account: Address; chainId: bigint };

/**
 * All VoteWeighting nominees (mainnet only). Every caller passes the same parameters, so they
 * share one wagmi query: the list, Nominate and the Retry buttons read and refresh the same data.
 */
export const useNominees = () => {
  const { data, status, refetch, isFetching } = useReadContract({
    address: (VOTE_WEIGHTING.addresses as Record<number, Address>)[mainnet.id],
    abi: VOTE_WEIGHTING.abi as Abi,
    chainId: mainnet.id,
    functionName: 'getAllNominees',
  });

  return {
    nominees: data as Nominee[] | undefined,
    status,
    isFetching,
    refetch,
  };
};
