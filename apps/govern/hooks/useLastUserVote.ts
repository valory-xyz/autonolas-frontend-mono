import { Abi } from 'viem';
import { Address } from 'viem';
import { mainnet } from 'viem/chains';
import { useReadContracts } from 'wagmi';

import { VOTE_WEIGHTING } from 'libs/util-contracts/src/lib/abiAndAddresses';

import { LAST_USER_VOTE_KEY } from 'common-util/constants/scopeKeys';
import { getNomineeHash } from 'common-util/functions/nominee-hash';
import { Nominee } from 'types';

export const useLastUserVote = (nominees: Nominee[], account: Address | null, enabled: boolean) => {
  const contracts = nominees.map((nominee) => ({
    address: (VOTE_WEIGHTING.addresses as Record<number, Address>)[mainnet.id],
    abi: VOTE_WEIGHTING.abi as Abi,
    chainId: mainnet.id,
    functionName: 'lastUserVote',
    args: [account, getNomineeHash(nominee.account, Number(nominee.chainId))],
    scopeKey: LAST_USER_VOTE_KEY,
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
