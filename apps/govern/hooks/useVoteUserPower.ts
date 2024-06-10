import { Abi } from 'viem';
import { useReadContract } from 'wagmi';

import { VOTE_WEIGHTING } from 'libs/util-contracts/src/lib/abiAndAddresses';

import { VOTE_USER_POWER_KEY } from 'common-util/constants/scopeKeys';

export const useVoteUserPower = (account?: `0x${string}`) => {
  const { data } = useReadContract({
    address: (VOTE_WEIGHTING.addresses as Record<number, `0x${string}`>)[1],
    abi: VOTE_WEIGHTING.abi as Abi,
    chainId: 1,
    functionName: 'voteUserPower',
    args: [account],
    scopeKey: VOTE_USER_POWER_KEY,
    query: {
      enabled: !!account,
    },
  });

  return { data };
};
