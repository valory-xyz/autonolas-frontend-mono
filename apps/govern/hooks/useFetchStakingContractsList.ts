import { useEffect, useMemo, useState } from 'react';
import { GovernContractCacheSnapshot, Nominee, StakingContract, Weight } from 'types';
import { Address } from 'viem';

import { useNominees, useNomineesMetadata } from 'libs/common-contract-functions/src';
import { BLACKLISTED_STAKING_ADDRESSES } from 'libs/util-constants/src';
import {
  areAddressesEqual,
  getAddressFromBytes32,
  getBytes32FromAddress,
} from 'libs/util-functions/src';

import { setStakingContracts } from 'store/govern';
import { useAppDispatch, useAppSelector } from 'store/index';

type WeightsMap = Record<Address, { current: Weight; next: Weight }>;

/**
 * Fetches pre-computed nominee weights from the server-side API.
 * The API caches results for 5 minutes (s-maxage=300).
 */
function useNomineeWeightsApi(nominees: Nominee[]) {
  const [weights, setWeights] = useState<WeightsMap | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const nomineeKey = useMemo(
    () => nominees.map((n) => `${n.chainId}:${n.account}`).join(','),
    [nominees],
  );

  useEffect(() => {
    if (nominees.length === 0) {
      setWeights(null);
      setIsLoaded(true);
      return;
    }

    setIsLoaded(false);
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/nominees/weights');

        if (cancelled) return;

        if (res.ok) {
          const data = (await res.json()) as WeightsMap;
          if (!cancelled) setWeights(data);
        }
      } catch {
        // Weights will remain null; the UI can show a loading state
      }
      if (!cancelled) setIsLoaded(true);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [nomineeKey, nominees]);

  return { weights, isLoaded };
}

/**
 * Fetches blob cache for all nominees in a single batch request via
 * the `/api/contracts/batch` endpoint.
 * On a cache miss the route fetches from RPC, writes to blob, and returns the data —
 * so subsequent calls are always served from blob.
 * Returns the map and an isLoaded flag that becomes true once the fetch settles.
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
      try {
        const body = nominees.map((n) => ({
          chainId: Number(n.chainId),
          address: getAddressFromBytes32(n.account),
        }));

        const res = await fetch('/api/contracts/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nominees: body }),
        });

        if (cancelled) return;

        if (!res.ok) {
          setCacheMap(new Map());
          setIsLoaded(true);
          return;
        }

        const data = (await res.json()) as Record<string, GovernContractCacheSnapshot>;

        if (cancelled) return;

        // Map batch response keys (chainId:address) back to nominee accounts (bytes32)
        const next = new Map<string, GovernContractCacheSnapshot>();
        nominees.forEach((n) => {
          const address = getAddressFromBytes32(n.account).toLowerCase();
          const key = `${Number(n.chainId)}:${address}`;
          const snapshot = data[key];
          if (snapshot) next.set(n.account, snapshot);
        });

        setCacheMap(next);
      } catch {
        if (!cancelled) setCacheMap(new Map());
      }
      if (!cancelled) setIsLoaded(true);
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

  // Fetch weights from server-side API (cached, 0 client RPC calls)
  const { weights, isLoaded: isWeightsLoaded } = useNomineeWeightsApi(nominees || []);

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
    if (!nominees || !isWeightsLoaded || !weights || !isCacheLoaded) return;
    if (stakingContracts.length !== 0) return;
    // If some nominees weren't in blob, wait for IPFS fallback to resolve
    if (uncachedNominees.length > 0 && fallbackMetadata == null) return;

    const defaultWeight: Weight = { percentage: 0, value: 0 };
    const stakingContractsList: StakingContract[] = [];
    nominees.forEach((item) => {
      const isBlacklisted = BLACKLISTED_STAKING_ADDRESSES.some((addr) =>
        areAddressesEqual(item.account, getBytes32FromAddress(addr)),
      );
      if (isBlacklisted) return;

      const cached = cacheMap.get(item.account);
      const metadata = cached?.data.metadata ??
        fallbackMetadata?.[item.account] ?? { name: '', description: '' };

      const nomineeWeights = weights[item.account];

      stakingContractsList.push({
        address: item.account,
        chainId: Number(item.chainId),
        currentWeight: nomineeWeights?.current ?? defaultWeight,
        nextWeight: nomineeWeights?.next ?? defaultWeight,
        metadata,
      });
    });

    dispatch(setStakingContracts(stakingContractsList));
  }, [
    cacheMap,
    weights,
    isWeightsLoaded,
    dispatch,
    fallbackMetadata,
    isCacheLoaded,
    nominees,
    stakingContracts.length,
    uncachedNominees.length,
  ]);
};
