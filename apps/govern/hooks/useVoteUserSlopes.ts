import { Abi } from 'viem';
import { Address } from 'viem';
import { mainnet } from 'viem/chains';
import { useReadContracts } from 'wagmi';

import { VOTE_WEIGHTING } from '@autonolas-frontend-mono/util-contracts';

import { getNomineeHash } from 'common-util/functions/nominee-hash';

export const useVoteUserSlopes = (
  nominees: { account: Address; chainId: number }[],
  account: Address | null,
  blockNumber: bigint | null,
  enabled: boolean,
  scopeKey?: string,
) => {
  const contracts = nominees.map((nominee) => ({
    address: (VOTE_WEIGHTING.addresses as Record<number, Address>)[mainnet.id],
    abi: VOTE_WEIGHTING.abi as Abi,
    chainId: mainnet.id,
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
