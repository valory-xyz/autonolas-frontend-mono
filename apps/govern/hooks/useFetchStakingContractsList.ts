import { useEffect, useMemo, useState } from 'react';
import { GovernContractCacheSnapshot, Nominee, StakingContract } from 'types';
import { Address } from 'viem';
import { mainnet } from 'viem/chains';
import { useReadContract } from 'wagmi';

import { useNominees, useNomineesMetadata } from 'libs/common-contract-functions/src';
import { BLACKLISTED_STAKING_ADDRESSES } from 'libs/util-constants/src';
import { VOTE_WEIGHTING } from 'libs/util-contracts/src/lib/abiAndAddresses';
import { areAddressesEqual, getAddressFromBytes32, getBytes32FromAddress } from 'libs/util-functions/src';

import { NEXT_RELATIVE_WEIGHTS_KEY, TIME_SUM_KEY } from 'common-util/constants/scopeKeys';
import { WEEK_IN_SECONDS } from 'common-util/constants/time';
import { setStakingContracts } from 'store/govern';
import { useAppDispatch, useAppSelector } from 'store/index';

import { useNomineesWeights } from './useNomineesWeights';

const getCurrentWeightTimestamp = (timeSum: number | undefined) => {
  if (!timeSum) return null;
  if (timeSum * 1000 > Date.now()) return timeSum - WEEK_IN_SECONDS;
  return timeSum;
};

/**
 * Fetches blob cache for each nominee via the write-through API route.
 * On a cache miss the route fetches from RPC, writes to blob, and returns the data —
 * so subsequent calls are always served from blob.
 * Returns the map and an isLoaded flag that becomes true once all fetches settle.
 */
function useContractCacheMap(nominees: Nominee[]) {
  const [cacheMap, setCacheMap] = useState<Map<string, GovernContractCacheSnapshot>>(new Map());
  const [isLoaded, setIsLoaded] = useState(false);
  const nomineeKey = useMemo(
    () => nominees.map((n) => `${n.chainId}:${n.account}`).join(','),
    [nominees],
  );

  useEffect(() => {
    if (nominees.length === 0) {
      setCacheMap(new Map());
      setIsLoaded(true);
      return;
    }

    setIsLoaded(false);
    let cancelled = false;

    const load = async () => {
      const results = await Promise.all(
        nominees.map(async (n) => {
          const address = getAddressFromBytes32(n.account);
          const chainId = Number(n.chainId);
          try {
            const res = await fetch(`/api/contracts/${chainId}/${address}`);
            if (!res.ok) return { account: n.account, payload: null };
            const payload = (await res.json()) as GovernContractCacheSnapshot;
            return { account: n.account, payload };
          } catch {
            return { account: n.account, payload: null };
          }
        }),
      );

      if (cancelled) return;
      const next = new Map<string, GovernContractCacheSnapshot>();
      results.forEach(({ account, payload }) => {
        if (payload) next.set(account, payload);
      });
      setCacheMap(next);
      setIsLoaded(true);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [nomineeKey, nominees]);

  return { cacheMap, isLoaded };
}

export const useFetchStakingContractsList = () => {
  const dispatch = useAppDispatch();
  const { stakingContracts } = useAppSelector((state) => state.govern);

  const { data: nominees } = useNominees();

  const { data: timeSum } = useReadContract({
    address: (VOTE_WEIGHTING.addresses as Record<number, Address>)[mainnet.id],
    abi: VOTE_WEIGHTING.abi,
    chainId: mainnet.id,
    functionName: 'timeSum',
    scopeKey: TIME_SUM_KEY,
    query: { select: (data) => Number(data) },
  });

  const { data: currentWeight } = useNomineesWeights(
    nominees || [],
    getCurrentWeightTimestamp(timeSum),
  );

  const { data: nextWeight } = useNomineesWeights(
    nominees || [],
    timeSum || null,
    NEXT_RELATIVE_WEIGHTS_KEY,
  );

  // Fetch metadata from blob (write-through: miss → RPC → blob → return)
  const { cacheMap, isLoaded: isCacheLoaded } = useContractCacheMap(nominees || []);

  // Only fall back to IPFS for nominees the blob could not resolve.
  // Computed only after cache has settled so the list is stable.
  const uncachedNominees = useMemo(
    () => (isCacheLoaded ? (nominees || []).filter((n) => !cacheMap.has(n.account)) : []),
    [nominees, cacheMap, isCacheLoaded],
  );
  const { data: fallbackMetadata } = useNomineesMetadata(uncachedNominees);

  useEffect(() => {
    if (!nominees || !currentWeight || !nextWeight || !isCacheLoaded) return;
    if (stakingContracts.length !== 0) return;
    // If some nominees weren't in blob, wait for IPFS fallback to resolve
    if (uncachedNominees.length > 0 && fallbackMetadata == null) return;

    const stakingContractsList: StakingContract[] = [];
    nominees.forEach((item) => {
      const isBlacklisted = BLACKLISTED_STAKING_ADDRESSES.some((addr) =>
        areAddressesEqual(item.account, getBytes32FromAddress(addr)),
      );
      if (isBlacklisted) return;

      const cached = cacheMap.get(item.account);
      const metadata =
        cached?.data.metadata ?? fallbackMetadata?.[item.account] ?? { name: '', description: '' };

      stakingContractsList.push({
        address: item.account,
        chainId: Number(item.chainId),
        currentWeight: currentWeight[item.account],
        nextWeight: nextWeight[item.account],
        metadata,
      });
    });

    dispatch(setStakingContracts(stakingContractsList));
  }, [cacheMap, currentWeight, dispatch, fallbackMetadata, isCacheLoaded, nextWeight, nominees, stakingContracts.length, uncachedNominees.length]);
};
