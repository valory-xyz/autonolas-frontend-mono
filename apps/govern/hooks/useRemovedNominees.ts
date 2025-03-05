import { Abi, Address } from 'viem';
import { mainnet } from 'viem/chains';
import { useReadContract } from 'wagmi';

import { VOTE_WEIGHTING } from 'libs/util-contracts/src/lib/abiAndAddresses';
import { RemovedNominee, UserVotes } from 'types';
import { useMemo } from 'react';
import { getNomineeHash } from 'common-util/functions/nominee-hash';

export const useRemovedNominees = () => {
  const { data, isLoading } = useReadContract({
    address: (VOTE_WEIGHTING.addresses as Record<number, Address>)[mainnet.id],
    abi: VOTE_WEIGHTING.abi as Abi,
    chainId: mainnet.id,
    functionName: 'getAllRemovedNominees',
    query: {
      select: (data) => {
        return data as RemovedNominee[];
      },
    },
  });

  return { data, isLoading };
};

export const useRemovedVotedNominees = (userVotes: Record<string, UserVotes>) => {
  const { data: removedNominees, isLoading } = useRemovedNominees();

  const removedVotedNominees = useMemo(() => {
    if (!removedNominees) return [];

    const res: RemovedNominee[] = [];
    const nomineeMap = new Map();

    // Create a map using a combined key of address and chainId for faster lookup
    removedNominees.forEach((nominee) => {
      const key = getNomineeHash(nominee.account, Number(nominee.chainId));
      nomineeMap.set(key, nominee);
    });

    Object.entries(userVotes).forEach(([address, item]) => {
      const key = getNomineeHash(address as Address, item.chainId);

      if (nomineeMap.has(key)) {
        res.push(nomineeMap.get(key));
      }
    });

    return res;
  }, [removedNominees, userVotes]);

  return { removedVotedNominees, isLoading };
};
