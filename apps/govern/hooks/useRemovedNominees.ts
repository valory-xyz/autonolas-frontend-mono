import { Abi, Address } from 'viem';
import { mainnet } from 'viem/chains';
import { useReadContract } from 'wagmi';

import { VOTE_WEIGHTING } from 'libs/util-contracts/src/lib/abiAndAddresses';
import { Nominee, UserVotes } from 'types';
import { useMemo } from 'react';
import { getNomineeHash } from 'common-util/functions/nominee-hash';
import { getBytes32FromAddress } from 'libs/util-functions/src';
import { ethers } from 'ethers';

export const useRemovedNominees = () => {
  const { data, isLoading } = useReadContract({
    address: (VOTE_WEIGHTING.addresses as Record<number, Address>)[mainnet.id],
    abi: VOTE_WEIGHTING.abi as Abi,
    chainId: mainnet.id,
    functionName: 'getAllRemovedNominees',
    query: {
      select: (data) =>
        (data as Nominee[]).filter(
          (item) => item.account !== getBytes32FromAddress(ethers.ZeroAddress),
        ),
    },
  });

  return { data, isLoading };
};

export const useRemovedVotedNominees = (userVotes: Record<string, UserVotes>) => {
  const { data: removedNominees, isLoading } = useRemovedNominees();

  const removedVotedNominees = useMemo(() => {
    if (!removedNominees) return [];

    const res: Nominee[] = [];
    const nomineeMap = new Map();

    // Create a map using a combined key of address and chainId for faster lookup
    removedNominees.forEach((nominee) => {
      const key = getNomineeHash(nominee.account, Number(nominee.chainId));
      nomineeMap.set(key, nominee);
    });

    Object.entries(userVotes).forEach(([address, item]) => {
      const key = getNomineeHash(address, item.chainId);

      if (nomineeMap.has(key)) {
        res.push(nomineeMap.get(key));
      }
    });

    return res;
  }, [removedNominees, userVotes]);

  return { removedVotedNominees, isLoading };
};
