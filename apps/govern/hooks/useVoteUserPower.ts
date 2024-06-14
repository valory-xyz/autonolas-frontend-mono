import { Abi } from 'viem';
import { mainnet } from 'viem/chains';
import { useReadContract } from 'wagmi';

import { VOTE_WEIGHTING } from 'libs/util-contracts/src/lib/abiAndAddresses';

import { VOTE_USER_POWER_KEY } from 'common-util/constants/scopeKeys';
import { Address } from 'types/index';

export const useVoteUserPower = (account?: Address) => {
  const { data } = useReadContract({
    address: (VOTE_WEIGHTING.addresses as Record<number, Address>)[mainnet.id],
    abi: VOTE_WEIGHTING.abi as Abi,
    chainId: mainnet.id,
    functionName: 'voteUserPower',
    args: [account],
    scopeKey: VOTE_USER_POWER_KEY,
    query: {
      enabled: !!account,
    },
  });

  return { data };
};
