import { useCallback, useEffect, useState } from 'react';
import { Abi } from 'viem';
import { Address } from 'viem';
import { useReadContracts } from 'wagmi';

// eslint-disable-next-line @nx/enforce-module-boundaries
import { GATEWAY_URL, HASH_PREFIX } from 'libs/util-constants/src';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { STAKING_TOKEN } from 'libs/util-contracts/src';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { getAddressFromBytes32, getBytes32FromAddress } from 'libs/util-functions/src';

const BATCH_SIZE = 10;
const CONCURRENCY_LIMIT = 5;
// Timeout for IPFS metadata fetches in ms
// This prevents the UI from hanging indefinitely when IPFS content doesn't exist
const IPFS_FETCH_TIMEOUT_MS = 5000;

type HashesWithNominees = { nominee: Address; hash: string }[];
type Metadata = { name: string; description: string };

const fetchWithTimeout = async (url: string): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), IPFS_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

const fetchBatch = async (params: HashesWithNominees) => {
  const results = [];
  for (let i = 0; i < params.length; i += CONCURRENCY_LIMIT) {
    const batch = params.slice(i, i + CONCURRENCY_LIMIT);
    const responses = await Promise.allSettled(
      batch.map((item) => fetchWithTimeout(`${GATEWAY_URL}${item.hash}`)),
    );

    for (let j = 0; j < responses.length; j++) {
      const response = responses[j];
      if (response.status === 'fulfilled' && response.value) {
        try {
          const data = await response.value.json();
          results.push(data);
        } catch {
          // Failed to parse JSON
          console.warn(`Failed to parse metadata for ${batch[j]?.hash}`);
          results.push(null);
        }
      } else {
        // Log timeout or fetch failure
        if (response.status === 'rejected' && (response.reason as Error)?.name === 'AbortError') {
          console.warn(`IPFS fetch timed out for ${batch[j]?.hash}`);
        }
        results.push(null);
      }
    }
  }
  return results;
};

export const useNomineesMetadata = (nominees: { account: Address; chainId: bigint }[]) => {
  const [isLoading, setIsLoading] = useState(false);
  const [contractsMetadata, setContractsMetadata] = useState<Record<string, Metadata> | null>(null);

  const contracts = nominees.map((nominee) => ({
    address: getAddressFromBytes32(nominee.account),
    abi: STAKING_TOKEN.abi as Abi,
    chainId: Number(nominee.chainId),
    functionName: 'metadataHash',
  }));

  const { data, isFetching } = useReadContracts({
    contracts,
    query: {
      enabled: nominees.length > 0,
    },
  });

  const getMetadata = useCallback(async () => {
    if (!data) return;

    setIsLoading(true);

    try {
      const hashesWithNominees = data.reduce((res: HashesWithNominees, item, index) => {
        if (item.status === 'success') {
          res.push({
            nominee: nominees[index].account,
            hash: (item.result as string).replace('0x', HASH_PREFIX),
          });
        }
        return res;
      }, []);

      const metadataResults: Record<string, Metadata> = {};
      for (let i = 0; i < hashesWithNominees.length; i += BATCH_SIZE) {
        const batch = hashesWithNominees.slice(i, i + BATCH_SIZE);
        const batchResults = await fetchBatch(batch);
        batch.forEach((item, index) => {
          if (batchResults[index]) {
            metadataResults[getBytes32FromAddress(item.nominee)] = batchResults[index];
          }
        });
      }

      setContractsMetadata(metadataResults);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching metadata:', error);
      setIsLoading(false);
    }
  }, [data, nominees]);

  useEffect(() => {
    if (data && !isFetching && !contractsMetadata && !isLoading) {
      getMetadata();
    }
  }, [contractsMetadata, data, getMetadata, isFetching, isLoading]);

  return { data: contractsMetadata, isLoading };
};
