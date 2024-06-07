import { Abi } from 'viem';
import { useReadContracts } from 'wagmi';

import { VOTE_WEIGHTING } from 'libs/util-contracts/src/lib/abiAndAddresses';

import { getNomineeHash } from 'common-util/functions/nominee-hash';

export const useLastUserVote = (
  nominees: { account: `0x${string}`; chainId: number }[],
  account: `0x${string}` | null,
  enabled: boolean,
) => {
  const contracts = nominees.map((nominee) => ({
    address: (VOTE_WEIGHTING.addresses as Record<number, `0x${string}`>)[1],
    abi: VOTE_WEIGHTING.abi as Abi,
    chainId: 1,
    functionName: 'lastUserVote',
    args: [account, getNomineeHash(nominee.account, nominee.chainId)],
  }));

  const { data } = useReadContracts({
    contracts,
    query: {
      enabled: nominees.length > 0 && !!account && enabled,
      select: (data) =>
        Math.max(...data.map((item) => (item.status === 'success' ? Number(item.result) : 0))),
    },
  });
  return { data };
};
