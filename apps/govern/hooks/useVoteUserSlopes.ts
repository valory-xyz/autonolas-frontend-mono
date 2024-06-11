import { Address } from 'types/index';
import { Abi } from 'viem';
import { useReadContracts } from 'wagmi';

import { VOTE_WEIGHTING } from 'libs/util-contracts/src/lib/abiAndAddresses';

import { getNomineeHash } from 'common-util/functions/nominee-hash';

export const useVoteUserSlopes = (
  nominees: { account: Address; chainId: number }[],
  account: Address | null,
  blockNumber: bigint | null,
  enabled: boolean,
  scopeKey?: string,
) => {
  const contracts = nominees.map((nominee) => ({
    address: (VOTE_WEIGHTING.addresses as Record<number, Address>)[1],
    abi: VOTE_WEIGHTING.abi as Abi,
    chainId: 1,
    functionName: 'voteUserSlopes',
    args: [account, getNomineeHash(nominee.account, nominee.chainId)],
  }));

  const { data } = useReadContracts({
    contracts,
    scopeKey,
    blockNumber: blockNumber as bigint,
    query: {
      enabled: nominees.length > 0 && !!account && !!blockNumber && enabled,
    },
  });
  return { data };
};
